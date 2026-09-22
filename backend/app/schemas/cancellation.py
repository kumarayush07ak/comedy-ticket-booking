from pydantic import BaseModel

class CancellationResponse(BaseModel):
    booking_id: int
    booking_status: str
    payment_status: str | None
    message: str

    