from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String

from app.database import Base


class Workout(Base):
    __tablename__ = "workouts"
    __allow_unmapped__ = True

    id = Column(Integer, primary_key=True, index=True)
    activity_type = Column(String(100), nullable=False)
    duration_minutes = Column(Float, nullable=False)
    distance_miles = Column(Float, nullable=True)
    calories_burned = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class StravaToken(Base):
    __tablename__ = "strava_tokens"
    __allow_unmapped__ = True

    id = Column(Integer, primary_key=True, index=True)
    athlete_id = Column(Integer, unique=True, index=True)
    firstname = Column(String(100), nullable=True)
    lastname = Column(String(100), nullable=True)
    access_token = Column(String, nullable=False)
    refresh_token = Column(String, nullable=False)
    expires_at = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
