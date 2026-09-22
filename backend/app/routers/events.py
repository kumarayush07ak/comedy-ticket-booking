from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from datetime import date
from typing import Optional

from app.dependencies.auth import require_admin
from app.dependencies.database import get_db
from app.models import User
from app.schemas.event import (
    EventCreateRequest,
    EventResponse,
    EventSeatAvailabilityResponse,
)
from app.services.event_service import EventService


router = APIRouter(
    prefix="/events",
    tags=["Events"],
)


@router.post(
    "",
    response_model=EventResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_event(
    request: EventCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    service = EventService(db)

    return service.create_event(request)


@router.get(
    "",
    response_model=list[EventResponse],
)
def get_events(
    city_id: Optional[int] = None,
    venue_id: Optional[int] = None,
    event_date: Optional[date] = None,
    event_format: Optional[str] = None,
    event_status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    service = EventService(db)

    return service.get_events(
        city_id=city_id,
        venue_id=venue_id,
        event_date=event_date,
        event_format=event_format,
        event_status=event_status,
        search=search,
    )


@router.get(
    "/{event_id}",
    response_model=EventResponse,
)
def get_event(
    event_id: int,
    db: Session = Depends(get_db),
):
    service = EventService(db)
    return service.get_event(event_id)

@router.get(
    "/{event_id}/seats",
    response_model=EventSeatAvailabilityResponse,
)
def get_event_seats(
    event_id: int,
    db: Session = Depends(get_db),
):
    service = EventService(db)
    return service.get_event_seats(event_id)