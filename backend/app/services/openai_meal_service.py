from __future__ import annotations

import json
import logging
from typing import List, Optional

from fastapi import HTTPException, status
from openai import OpenAI, OpenAIError
from pydantic import BaseModel, Field

from app.config import settings

logger = logging.getLogger(__name__)


class WorkoutInput(BaseModel):
    sport_type: str
    moving_time_seconds: int = Field(ge=0)
    calories: Optional[float] = Field(default=None, ge=0)
    suffer_score: Optional[int] = Field(default=None, ge=0)


class RestaurantInput(BaseModel):
    name: str
    categories: List[str] = Field(default_factory=list)
    rating: Optional[float] = None
    price: Optional[str] = None


class MealRecommendationRequest(BaseModel):
    workout: WorkoutInput
    restaurant: RestaurantInput


class MealRecommendation(BaseModel):
    depletion_breakdown: str
    target_calories: int
    appetizer: str
    main_entree: str
    recovery_drink: str
    why_this_meal: str


def build_meal_recommendation(
    recommendation_request: MealRecommendationRequest,
) -> MealRecommendation:
    if not settings.openai_api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "OPENAI_API_KEY is missing. Add it to backend/.env and "
                "restart the server."
            ),
        )

    logger.info(
        "Generating meal recommendation with OpenAI model: %s",
        settings.openai_model,
    )

    client = OpenAI(api_key=settings.openai_api_key)
    payload = recommendation_request.model_dump()

    try:
        response = client.responses.parse(
            model=settings.openai_model,
            input=[
                {
                    "role": "system",
                    "content": (
                        "You are a sports recovery nutrition assistant. Return a "
                        "practical post-workout restaurant order as strict JSON. "
                        "Do not claim to know the restaurant's real menu. Recommend "
                        "generally plausible order types based on the cuisine, "
                        "restaurant categories, workout duration, calories, and "
                        "suffer score. Keep advice general and non-medical."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        "Create a recovery meal recommendation for this workout "
                        "and restaurant context. Use only the provided context. "
                        f"JSON input: {json.dumps(payload)}"
                    ),
                },
            ],
            text_format=MealRecommendation,
        )
    except OpenAIError as exc:
        logger.exception("OpenAI meal recommendation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="OpenAI could not generate a meal recommendation. Please try again.",
        ) from exc
    except Exception as exc:
        logger.exception("Unexpected meal recommendation error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="OpenAI could not generate a meal recommendation. Please try again.",
        ) from exc

    if response.output_parsed is None:
        logger.error("OpenAI returned no parsed meal recommendation.")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="OpenAI returned an empty meal recommendation. Please try again.",
        )

    return response.output_parsed
