from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.dependencies.auth import require_admin
from app.dependencies.database import get_db
from app.models import User, Venue
from app.schemas.venue import (
    VenueCreateRequest,
    VenueResponse,
    VenueUpdateRequest,
)
from app.services.venue_service import VenueService


router = APIRouter(
    prefix="/venues",
    tags=["Venues"],
)


@router.post(
    "",
    response_model=VenueResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_venue(
    data: VenueCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    service = VenueService(db)
    return service.create_venue(data)


@router.get(
    "",
    response_model=list[VenueResponse],
)
def get_venues(
    db: Session = Depends(get_db),
):
    service = VenueService(db)
    return service.get_all_venues()


@router.get(
    "/city/{city_id}",
    response_model=list[VenueResponse],
)
def get_venues_by_city(
    city_id: int,
    db: Session = Depends(get_db),
):
    service = VenueService(db)
    return service.get_venues_by_city(city_id)


@router.get(
    "/{venue_id}",
    response_model=VenueResponse,
)
def get_venue(
    venue_id: int,
    db: Session = Depends(get_db),
):
    service = VenueService(db)
    return service.get_venue(venue_id)


@router.put(
    "/{venue_id}",
    response_model=VenueResponse,
)
def update_venue(
    venue_id: int,
    data: VenueUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    service = VenueService(db)
    return service.update_venue(venue_id, data)


@router.delete(
    "/{venue_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_venue(
    venue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    service = VenueService(db)
    service.delete_venue(venue_id)