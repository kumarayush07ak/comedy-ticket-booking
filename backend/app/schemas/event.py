from datetime import date, time, datetime

from pydantic import BaseModel, Field


class EventCreateRequest(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    description: str | None = None
    event_format: str
    venue_id: int = Field(gt=0)

    event_date: date
    start_time: time
    end_time: time

    ticket_price: float = Field(gt=0)
    poster_url: str | None = None

    organizer_name: str = Field(min_length=2, max_length=150)
    organizer_email: str | None = None
    organizer_phone: str | None = None


class EventUpdateRequest(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    description: str | None = None
    event_format: str
    venue_id: int = Field(gt=0)

    event_date: date
    start_time: time
    end_time: time

    ticket_price: float = Field(gt=0)
    poster_url: str | None = None

    organizer_name: str = Field(min_length=2, max_length=150)
    organizer_email: str | None = None
    organizer_phone: str | None = None

    status: str


class EventResponse(BaseModel):
    id: int
    title: str
    description: str | None
    event_format: str
    venue_id: int

    event_date: date
    start_time: time
    end_time: time

    ticket_price: float
    poster_url: str | None

    organizer_name: str
    organizer_email: str | None
    organizer_phone: str | None

    status: str
    created_at: datetime
    updated_at: datetime

class EventSeatResponse(BaseModel):
    event_seat_id: int
    seat_id: int
    seat_label: str
    row_label: str
    seat_number: int
    status: str
    price: float


class EventSeatAvailabilityResponse(BaseModel):
    event_id: int
    total_seats: int
    rows: dict[str, list[EventSeatResponse]]