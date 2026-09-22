from pydantic import BaseModel


class EventCancellationResponse(BaseModel):
    event_id: int
    event_status: str
    cancelled_bookings: int
    refunded_payments: int
    cancelled_tickets: int
    released_seats: int
    message: str