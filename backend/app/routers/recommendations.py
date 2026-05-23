from fastapi import APIRouter

from app.services.openai_meal_service import (
    MealRecommendation,
    MealRecommendationRequest,
    build_meal_recommendation,
)

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.post("/meal")
def meal_recommendation(
    recommendation_request: MealRecommendationRequest,
) -> MealRecommendation:
    return build_meal_recommendation(recommendation_request)
