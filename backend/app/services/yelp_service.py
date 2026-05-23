from __future__ import annotations

import httpx
from fastapi import HTTPException, status

from app.config import settings

YELP_BUSINESS_SEARCH_URL = "https://api.yelp.com/v3/businesses/search"


def clean_restaurant(business: dict) -> dict:
    location = business.get("location") or {}
    address_parts = location.get("display_address") or []
    categories = business.get("categories") or []

    return {
        "name": business.get("name"),
        "rating": business.get("rating"),
        "review_count": business.get("review_count"),
        "price": business.get("price"),
        "categories": [category.get("title") for category in categories],
        "address": ", ".join(address_parts),
        "phone": business.get("display_phone") or business.get("phone"),
        "url": business.get("url"),
        "image_url": business.get("image_url"),
        "is_closed": business.get("is_closed"),
    }


def search_restaurants(
    latitude: float,
    longitude: float,
    cuisine: str,
) -> list[dict]:
    if not settings.yelp_api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "YELP_API_KEY is missing. Add it to backend/.env and "
                "restart the server."
            ),
        )

    headers = {"Authorization": f"Bearer {settings.yelp_api_key}"}
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "term": cuisine,
        "categories": "restaurants",
        "limit": 10,
        "sort_by": "best_match",
    }

    try:
        response = httpx.get(
            YELP_BUSINESS_SEARCH_URL,
            headers=headers,
            params=params,
            timeout=20,
        )
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=exc.response.status_code,
            detail=(
                "Yelp could not return restaurants for this search. "
                "Check your API key, coordinates, and cuisine value."
            ),
        ) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not reach Yelp to search restaurants.",
        ) from exc

    data = response.json()
    businesses = data.get("businesses")
    if not isinstance(businesses, list):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Yelp returned an unexpected restaurant response. Please try again.",
        )

    return [clean_restaurant(business) for business in businesses]
