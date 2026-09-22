from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Event, EventFormat, EventSeat, EventStatus, Seat
from app.repositories.event_repository import EventRepository
from app.repositories.seat_repository import SeatRepository
from app.schemas.event import (
    EventCreateRequest,
    EventResponse,
    EventSeatAvailabilityResponse,
    EventSeatResponse,
)
from datetime import date


class EventService:

    def __init__(self, db: Session):
        self.db = db
        self.event_repository = EventRepository()
        self.seat_repository = SeatRepository()

    def _validate_event_format(self, event_format: str) -> EventFormat:
        normalized_format = event_format.strip().upper()

        try:
            return EventFormat(normalized_format)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Invalid event format. Allowed values: "
                    "STANDUP, OPEN_MIC, IMPROV, COMEDY_SHOW"
                ),
            )

    def _validate_times(
        self,
        start_time,
        end_time,
    ):
        if end_time <= start_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="End time must be after start time",
            )

    def _validate_venue(self, venue_id: int):
        from app.models import Venue

        venue = self.db.get(Venue, venue_id)

        if venue is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Venue not found",
            )

        return venue

    def create_event(
        self,
        request: EventCreateRequest,
    ) -> EventResponse:

        # 1. Validate venue.
        venue = self._validate_venue(request.venue_id)

        # 2. Validate event format.
        event_format = self._validate_event_format(
            request.event_format
        )

        # 3. Validate time range.
        self._validate_times(
            request.start_time,
            request.end_time,
        )

        # 4. Get the physical seats belonging to this venue.
        physical_seats = self.seat_repository.get_by_venue_id(
            self.db,
            venue.id,
        )

        if not physical_seats:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Venue does not have a physical seat layout",
            )

        # 5. Create the event.
        event = Event(
            title=request.title.strip(),
            description=(
                request.description.strip()
                if request.description
                else None
            ),
            event_format=event_format,
            venue_id=venue.id,
            event_date=request.event_date,
            start_time=request.start_time,
            end_time=request.end_time,
            ticket_price=request.ticket_price,
            poster_url=(
                request.poster_url.strip()
                if request.poster_url
                else None
            ),
            organizer_name=request.organizer_name.strip(),
            organizer_email=(
                request.organizer_email.strip()
                if request.organizer_email
                else None
            ),
            organizer_phone=(
                request.organizer_phone.strip()
                if request.organizer_phone
                else None
            ),
            status=EventStatus.UPCOMING,
        )

        self.event_repository.create(
            self.db,
            event,
        )

        # 6. Automatically create one EventSeat
        #    for every physical Seat.
        for seat in physical_seats:
            event_seat = EventSeat(
                event_id=event.id,
                seat_id=seat.id,
            )

            self.db.add(event_seat)

        # Make sure EventSeat rows are written
        # before returning the response.
        self.db.flush()

        self.db.refresh(event)

        return EventResponse(
            id=event.id,
            title=event.title,
            description=event.description,
            event_format=event.event_format.value,
            venue_id=event.venue_id,
            event_date=event.event_date,
            start_time=event.start_time,
            end_time=event.end_time,
            ticket_price=event.ticket_price,
            poster_url=event.poster_url,
            organizer_name=event.organizer_name,
            organizer_email=event.organizer_email,
            organizer_phone=event.organizer_phone,
            status=event.status.value,
            created_at=event.created_at,
            updated_at=event.updated_at,
        )

    def _to_response(self, event: Event) -> EventResponse:
        return EventResponse(
            id=event.id,
            title=event.title,
            description=event.description,
            event_format=event.event_format.value,
            venue_id=event.venue_id,
            event_date=event.event_date,
            start_time=event.start_time,
            end_time=event.end_time,
            ticket_price=event.ticket_price,
            poster_url=event.poster_url,
            organizer_name=event.organizer_name,
            organizer_email=event.organizer_email,
            organizer_phone=event.organizer_phone,
            status=event.status.value,
            created_at=event.created_at,
            updated_at=event.updated_at,
        )

    def get_events(
        self,
        city_id: int | None = None,
        venue_id: int | None = None,
        event_date: date | None = None,
        event_format: str | None = None,
        event_status: str | None = None,
        search: str | None = None,
    ) -> list[EventResponse]:
        normalized_format = None

        if event_format:
            normalized_format = self._validate_event_format(event_format)

        events = self.event_repository.get_filtered(
            self.db,
            city_id=city_id,
            venue_id=venue_id,
            event_date=event_date,
            event_format=normalized_format,
            event_status=event_status,
            search=search,
        )

        return [self._to_response(event) for event in events]

    def get_event(self, event_id: int) -> EventResponse:
        event = self.event_repository.get_by_id(
            self.db,
            event_id,
        )

        if event is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found",
            )

        return self._to_response(event) 

    def get_event_seats(
        self,
        event_id: int,
    ) -> EventSeatAvailabilityResponse:
        event = self.event_repository.get_by_id(
            self.db,
            event_id,
        )

        if event is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found",
            )

        event_seats = self.event_repository.get_event_seats(
            self.db,
            event_id,
        )

        rows: dict[str, list[EventSeatResponse]] = {}

        for event_seat, seat in event_seats:
            seat_response = EventSeatResponse(
                event_seat_id=event_seat.id,
                seat_id=seat.id,
                seat_label=seat.seat_label,
                row_label=seat.row_label,
                seat_number=seat.seat_number,
                status=event_seat.status.value,
                price=event.ticket_price,
            )

            if seat.row_label not in rows:
                rows[seat.row_label] = []

            rows[seat.row_label].append(seat_response)

        return EventSeatAvailabilityResponse(
            event_id=event.id,
            total_seats=len(event_seats),
            rows=rows,
        )