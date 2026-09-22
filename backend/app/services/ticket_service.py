import secrets
from uuid import uuid4

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import BookingStatus, TicketStatus
from app.repositories.booking_repository import BookingRepository
from app.repositories.ticket_repository import TicketRepository
from app.schemas.ticket import TicketResponse


class TicketService:
    def __init__(self, db: Session):
        self.db = db
        self.ticket_repository = TicketRepository()
        self.booking_repository = BookingRepository()

    def _generate_ticket_number(self) -> str:
        return f"TKT-{uuid4().hex[:12].upper()}"

    def _generate_qr_token(self) -> str:
        return secrets.token_urlsafe(32)

    def _build_response(self, ticket) -> TicketResponse:
        return TicketResponse(
            id=ticket.id,
            booking_id=ticket.booking_id,
            ticket_number=ticket.ticket_number,
            qr_token=ticket.qr_token,
            status=ticket.status.value,
            generated_at=ticket.generated_at,
        )

    def create_ticket_for_confirmed_booking(
        self,
        booking_id: int,
    ):
        booking = self.booking_repository.get_by_id(
            self.db,
            booking_id,
        )

        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found",
            )

        if booking.status != BookingStatus.CONFIRMED:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ticket can only be generated for a confirmed booking",
            )

        existing_ticket = self.ticket_repository.get_by_booking_id(
            self.db,
            booking_id,
        )

        if existing_ticket:
            return existing_ticket

        ticket = self.ticket_repository.create_ticket(
            self.db,
            booking_id=booking_id,
            ticket_number=self._generate_ticket_number(),
            qr_token=self._generate_qr_token(),
        )

        self.db.flush()
        self.db.refresh(ticket)

        return ticket

    def create_ticket(
        self,
        booking_id: int,
    ) -> TicketResponse:

        # 1. Find the booking
        booking = self.booking_repository.get_by_id(
            self.db,
            booking_id,
        )

        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found",
            )

        # 2. Ticket can only be generated for a confirmed booking
        if booking.status != BookingStatus.CONFIRMED:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ticket can only be generated for a confirmed booking",
            )

        # 3. Idempotency:
        # If a ticket already exists, return the existing ticket.
        existing_ticket = self.ticket_repository.get_by_booking_id(
            self.db,
            booking_id,
        )

        if existing_ticket:
            return self._build_response(existing_ticket)

        # 4. Generate unique ticket number and secure QR token
        ticket_number = self._generate_ticket_number()
        qr_token = self._generate_qr_token()

        # 5. Store ticket
        ticket = self.ticket_repository.create_ticket(
            self.db,
            booking_id=booking_id,
            ticket_number=ticket_number,
            qr_token=qr_token,
        )

        self.db.flush()
        self.db.refresh(ticket)

        return self._build_response(ticket)

    def get_customer_ticket(
        self,
        ticket_id: int,
        user_id: int,
    ) -> TicketResponse:

        ticket = self.ticket_repository.get_by_id(
            self.db,
            ticket_id,
        )

        if not ticket:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found",
            )

        booking = self.booking_repository.get_by_id(
            self.db,
            ticket.booking_id,
        )

        if not booking or booking.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found",
            )

        return self._build_response(ticket)

    def scan_ticket(
        self,
        qr_token: str,
    ) -> dict:

        # 1. Lock the ticket row.
        # This prevents two admins from successfully scanning
        # the same ticket at the same time.
        ticket = self.ticket_repository.get_by_qr_token_for_update(
            self.db,
            qr_token,
        )

        if not ticket:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invalid QR token",
            )

        # 2. Ticket must be ACTIVE
        if ticket.status != TicketStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Ticket has already been {ticket.status.value.lower()}",
            )

        # 3. Mark ticket as used
        from datetime import datetime, timezone

        ticket.status = TicketStatus.USED
        ticket.used_at = datetime.now(timezone.utc)

        self.db.flush()

        return {
            "ticket_id": ticket.id,
            "ticket_number": ticket.ticket_number,
            "booking_id": ticket.booking_id,
            "status": ticket.status.value,
            "used_at": ticket.used_at,
            "message": "Ticket scanned successfully",
        }