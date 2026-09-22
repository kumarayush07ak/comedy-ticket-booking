from datetime import datetime

from pydantic import BaseModel


class TicketScanRequest(BaseModel):
    qr_token: str


class TicketScanResponse(BaseModel):
    ticket_id: int
    ticket_number: str
    booking_id: int
    status: str
    used_at: datetime | None
    message: str