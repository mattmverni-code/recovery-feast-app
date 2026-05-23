from fastapi import APIRouter, Query

from app.services.yelp_service import search_restaurants

router = APIRouter(prefix="/restaurants", tags=["Restaurants"])


@router.get("/search")
def restaurant_search(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    cuisine: str = Query(..., min_length=1),
) -> list[dict]:
    return search_restaurants(
        latitude=latitude,
        longitude=longitude,
        cuisine=cuisine,
    )
