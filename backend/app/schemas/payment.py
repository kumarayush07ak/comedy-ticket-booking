from datetime import datetime

from pydantic import BaseModel, Field


class PaymentCreateRequest(BaseModel):
    booking_id: int = Field(gt=0)


class PaymentResponse(BaseModel):
    id: int
    booking_id: int
    amount: float
    status: str
    transaction_id: str | None
    created_at: datetime