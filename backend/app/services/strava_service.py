from __future__ import annotations

import httpx
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import StravaToken
from app.services.token_service import get_valid_access_token

STRAVA_ACTIVITIES_URL = "https://www.strava.com/api/v3/athlete/activities"


def clean_activity(activity: dict) -> dict:
    return {
        "name": activity.get("name"),
        "sport_type": activity.get("sport_type"),
        "moving_time_seconds": activity.get("moving_time"),
        "calories": activity.get("calories"),
        "suffer_score": activity.get("suffer_score"),
        "distance_meters": activity.get("distance"),
        "start_date": activity.get("start_date"),
    }


def get_athlete_activities(
    db: Session,
    athlete_id: int,
    page: int = 1,
    per_page: int = 30,
) -> list[dict]:
    strava_user = (
        db.query(StravaToken)
        .filter(StravaToken.athlete_id == athlete_id)
        .one_or_none()
    )

    if strava_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No connected Strava athlete was found with that athlete ID.",
        )

    access_token = get_valid_access_token(db, athlete_id)
    headers = {"Authorization": f"Bearer {access_token}"}
    params = {"page": page, "per_page": per_page}

    try:
        response = httpx.get(
            STRAVA_ACTIVITIES_URL,
            headers=headers,
            params=params,
            timeout=20,
        )
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=exc.response.status_code,
            detail=(
                "Strava could not return activities for this athlete. "
                "Check that the athlete connected successfully and granted activity access."
            ),
        ) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not reach Strava to load activities.",
        ) from exc

    activities = response.json()
    if not isinstance(activities, list):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Strava returned an unexpected activities response. Please try again.",
        )

    return [clean_activity(activity) for activity in activities]
