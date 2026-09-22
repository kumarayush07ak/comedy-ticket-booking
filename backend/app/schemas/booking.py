from datetime import datetime

from pydantic import BaseModel, Field


class BookingCreateRequest(BaseModel):
    event_id: int = Field(gt=0)
    seat_ids: list[int] = Field(
        min_length=1,
        max_length=10,
    )


class BookingItemResponse(BaseModel):
    seat_id: int
    seat_label: str
    row_label: str
    seat_number: int
    price: float


class BookingResponse(BaseModel):
    id: int
    user_id: int
    event_id: int
    event_title: str
    total_amount: float
    status: str
    created_at: datetime
    updated_at: datetime
    items: list[BookingItemResponse]