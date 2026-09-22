from datetime import datetime

from pydantic import BaseModel


class TicketResponse(BaseModel):
    id: int
    booking_id: int
    ticket_number: str
    qr_token: str
    status: str
    generated_at: datetime