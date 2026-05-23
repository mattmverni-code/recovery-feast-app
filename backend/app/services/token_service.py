from __future__ import annotations

import time

import httpx
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.models import StravaToken

STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token"
TOKEN_EXPIRY_BUFFER_SECONDS = 60


def require_strava_oauth_settings() -> None:
    if not settings.strava_client_id or not settings.strava_client_secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Strava OAuth is not configured. Add STRAVA_CLIENT_ID and "
                "STRAVA_CLIENT_SECRET to backend/.env, then restart the server."
            ),
        )


def exchange_code_for_tokens(code: str) -> dict:
    require_strava_oauth_settings()

    payload = {
        "client_id": settings.strava_client_id,
        "client_secret": settings.strava_client_secret,
        "code": code,
        "grant_type": "authorization_code",
    }

    try:
        response = httpx.post(STRAVA_TOKEN_URL, data=payload, timeout=15)
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Strava rejected the authorization code. Try starting again at "
                "/auth/strava/login. Authorization codes can only be used once."
            ),
        ) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not reach Strava to exchange the authorization code.",
        ) from exc

    return response.json()


def save_strava_tokens(db: Session, token_data: dict) -> StravaToken:
    athlete = token_data.get("athlete") or {}
    athlete_id = athlete.get("id")
    required_token_fields = ("access_token", "refresh_token", "expires_at")

    if not athlete_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Strava did not return an athlete ID.",
        )

    missing_fields = [
        field for field in required_token_fields if field not in token_data
    ]
    if missing_fields:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "Strava returned an incomplete token response. "
                "Please try connecting again."
            ),
        )

    strava_token = (
        db.query(StravaToken)
        .filter(StravaToken.athlete_id == athlete_id)
        .one_or_none()
    )

    if strava_token is None:
        strava_token = StravaToken(athlete_id=athlete_id)
        db.add(strava_token)

    strava_token.firstname = athlete.get("firstname")
    strava_token.lastname = athlete.get("lastname")
    strava_token.access_token = token_data["access_token"]
    strava_token.refresh_token = token_data["refresh_token"]
    strava_token.expires_at = token_data["expires_at"]

    db.commit()
    db.refresh(strava_token)
    return strava_token


def refresh_access_token(db: Session, strava_token: StravaToken) -> StravaToken:
    require_strava_oauth_settings()

    payload = {
        "client_id": settings.strava_client_id,
        "client_secret": settings.strava_client_secret,
        "grant_type": "refresh_token",
        "refresh_token": strava_token.refresh_token,
    }

    try:
        response = httpx.post(STRAVA_TOKEN_URL, data=payload, timeout=15)
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Strava rejected the saved refresh token. Reconnect the athlete "
                "by visiting /auth/strava/login again."
            ),
        ) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not reach Strava to refresh the access token.",
        ) from exc

    token_data = response.json()
    required_token_fields = ("access_token", "refresh_token", "expires_at")
    missing_fields = [
        field for field in required_token_fields if field not in token_data
    ]
    if missing_fields:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "Strava returned an incomplete refresh response. "
                "Please reconnect Strava."
            ),
        )

    strava_token.access_token = token_data["access_token"]
    strava_token.refresh_token = token_data["refresh_token"]
    strava_token.expires_at = token_data["expires_at"]

    db.commit()
    db.refresh(strava_token)
    return strava_token


def get_valid_access_token(db: Session, athlete_id: int) -> str:
    strava_token = (
        db.query(StravaToken)
        .filter(StravaToken.athlete_id == athlete_id)
        .one_or_none()
    )

    if strava_token is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No Strava token was found for that athlete.",
        )

    expires_soon = (
        strava_token.expires_at <= int(time.time()) + TOKEN_EXPIRY_BUFFER_SECONDS
    )
    if expires_soon:
        strava_token = refresh_access_token(db, strava_token)

    return strava_token.access_token
