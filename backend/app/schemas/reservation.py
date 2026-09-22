from datetime import datetime

from pydantic import BaseModel, Field


class ReservationHoldRequest(BaseModel):
    event_id: int = Field(gt=0)
    seat_ids: list[int] = Field(min_length=1, max_length=10)


class ReservationHoldResponse(BaseModel):
    reservation_id: str
    event_id: int
    seat_ids: list[int]
    expires_at: datetime
    hold_minutes: int