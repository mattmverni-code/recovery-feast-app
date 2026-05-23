from __future__ import annotations

from typing import Optional
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.services.token_service import exchange_code_for_tokens, save_strava_tokens

router = APIRouter(prefix="/auth/strava", tags=["Strava Auth"])

STRAVA_AUTHORIZE_URL = "https://www.strava.com/oauth/authorize"
STRAVA_SCOPES = "read,activity:read_all"


@router.get("/login")
def strava_login() -> RedirectResponse:
    if not settings.strava_client_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="STRAVA_CLIENT_ID is missing. Add it to backend/.env and restart the server.",
        )

    query_params = {
        "client_id": settings.strava_client_id,
        "redirect_uri": settings.strava_redirect_uri,
        "response_type": "code",
        "approval_prompt": "auto",
        "scope": STRAVA_SCOPES,
    }
    login_url = f"{STRAVA_AUTHORIZE_URL}?{urlencode(query_params)}"
    return RedirectResponse(login_url)


@router.get("/callback")
def strava_callback(
    code: Optional[str] = Query(default=None),
    error: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
) -> dict:
    if error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Strava authorization failed: {error}",
        )

    if not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing Strava authorization code.",
        )

    token_data = exchange_code_for_tokens(code)
    strava_token = save_strava_tokens(db, token_data)

    return {
        "message": "Strava account connected successfully.",
        "athlete_id": strava_token.athlete_id,
        "firstname": strava_token.firstname,
        "lastname": strava_token.lastname,
        "next_step": f"{settings.app_base_url}/docs",
    }
