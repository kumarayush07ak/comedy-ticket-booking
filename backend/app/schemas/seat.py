from pydantic import BaseModel, Field


class SeatRowRequest(BaseModel):
    row_label: str = Field(min_length=1, max_length=10)
    seat_count: int = Field(gt=0, le=100)


class SeatLayoutCreateRequest(BaseModel):
    rows: list[SeatRowRequest] = Field(min_length=1, max_length=100)


class SeatResponse(BaseModel):
    id: int
    venue_id: int
    row_label: str
    seat_number: int
    seat_label: str


class SeatLayoutResponse(BaseModel):
    venue_id: int
    total_seats: int
    rows: dict[str, list[SeatResponse]]