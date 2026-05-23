from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.openai_meal_service import (
    MealRecommendation,
    MealRecommendationRequest,
    RestaurantInput,
    WorkoutInput,
    build_meal_recommendation,
)
from app.services.strava_service import get_athlete_activities
from app.services.yelp_service import search_restaurants

router = APIRouter(tags=["Recovery Plan"])


class RecoveryPlanRequest(BaseModel):
    athlete_id: int
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    cuisine: str = Field(min_length=1)


class RecoveryPlanResponse(BaseModel):
    workout: dict
    selected_restaurant: dict
    meal_recommendation: MealRecommendation
    reservation_deep_link: Optional[str]


def pick_best_open_restaurant(restaurants: list[dict]) -> dict:
    open_restaurants = [
        restaurant
        for restaurant in restaurants
        if restaurant.get("is_closed") is False
    ]

    if not open_restaurants:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No open restaurants were found for that location and cuisine.",
        )

    return max(
        open_restaurants,
        key=lambda restaurant: (
            restaurant.get("rating") or 0,
            restaurant.get("review_count") or 0,
        ),
    )


@router.post("/recovery-plan")
def create_recovery_plan(
    recovery_request: RecoveryPlanRequest,
    db: Session = Depends(get_db),
) -> RecoveryPlanResponse:
    activities = get_athlete_activities(
        db=db,
        athlete_id=recovery_request.athlete_id,
        page=1,
        per_page=1,
    )
    if not activities:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No Strava activities were found for that athlete.",
        )

    workout = activities[0]
    restaurants = search_restaurants(
        latitude=recovery_request.latitude,
        longitude=recovery_request.longitude,
        cuisine=recovery_request.cuisine,
    )
    selected_restaurant = pick_best_open_restaurant(restaurants)

    meal_recommendation = build_meal_recommendation(
        MealRecommendationRequest(
            workout=WorkoutInput(
                sport_type=workout.get("sport_type") or "Unknown",
                moving_time_seconds=workout.get("moving_time_seconds") or 0,
                calories=workout.get("calories"),
                suffer_score=workout.get("suffer_score"),
            ),
            restaurant=RestaurantInput(
                name=selected_restaurant.get("name") or "Selected restaurant",
                categories=selected_restaurant.get("categories") or [],
                rating=selected_restaurant.get("rating"),
                price=selected_restaurant.get("price"),
            ),
        )
    )

    return RecoveryPlanResponse(
        workout=workout,
        selected_restaurant=selected_restaurant,
        meal_recommendation=meal_recommendation,
        reservation_deep_link=selected_restaurant.get("url"),
    )
