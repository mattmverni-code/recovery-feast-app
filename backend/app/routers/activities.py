from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.strava_service import get_athlete_activities

router = APIRouter(prefix="/activities", tags=["Activities"])


@router.get("/{athlete_id}")
def list_activities(
    athlete_id: int,
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=30, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[dict]:
    return get_athlete_activities(
        db=db,
        athlete_id=athlete_id,
        page=page,
        per_page=per_page,
    )
