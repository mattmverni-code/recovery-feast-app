from __future__ import annotations

from typing import Dict, Union

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth.strava_auth import router as strava_auth_router
from app.config import get_cors_origins, settings
from app.database import Base, engine
from app.routers.activities import router as activities_router
from app.routers.debug import router as debug_router
from app.routers.recommendations import router as recommendations_router
from app.routers.recovery_plan import router as recovery_plan_router
from app.routers.restaurants import router as restaurants_router
from app import models

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.app_name,
    description="Backend API for AI Recovery & Post-Workout Feast Architect.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(strava_auth_router)
app.include_router(activities_router)
app.include_router(debug_router)
app.include_router(restaurants_router)
app.include_router(recommendations_router)
app.include_router(recovery_plan_router)


@app.get("/")
def read_root() -> Dict[str, str]:
    return {
        "message": "AI Recovery & Post-Workout Feast Architect API is running."
    }


@app.get("/health")
def health_check() -> Dict[str, Union[str, bool]]:
    return {
        "status": "healthy",
        "app_name": settings.app_name,
        "database_configured": bool(settings.database_url),
        "strava_configured": bool(
            settings.strava_client_id and settings.strava_client_secret
        ),
        "yelp_configured": bool(settings.yelp_api_key),
        "openai_configured": bool(settings.openai_api_key),
    }
