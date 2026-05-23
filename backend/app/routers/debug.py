from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import StravaToken

router = APIRouter(prefix="/debug", tags=["Debug"])


@router.get("/users")
def list_saved_strava_users(db: Session = Depends(get_db)) -> list[dict]:
    if settings.environment.lower() == "production":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not found.",
        )

    users = db.query(StravaToken).order_by(StravaToken.athlete_id).all()

    return [
        {
            "athlete_id": user.athlete_id,
            "firstname": user.firstname,
            "lastname": user.lastname,
            "expires_at": user.expires_at,
            "created_at": user.created_at,
            "updated_at": user.updated_at,
        }
        for user in users
    ]
