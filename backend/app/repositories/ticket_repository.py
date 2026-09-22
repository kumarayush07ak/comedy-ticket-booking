from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Ticket


class TicketRepository:

    def create_ticket(
        self,
        db: Session,
        booking_id: int,
        ticket_number: str,
        qr_token: str,
    ):
        ticket = Ticket(
            booking_id=booking_id,
            ticket_number=ticket_number,
            qr_token=qr_token,
        )

        db.add(ticket)
        db.flush()

        return ticket

    def get_by_id(
        self,
        db: Session,
        ticket_id: int,
    ):
        statement = select(Ticket).where(
            Ticket.id == ticket_id
        )

        return db.scalar(statement)

    def get_by_booking_id(
        self,
        db: Session,
        booking_id: int,
    ):
        statement = select(Ticket).where(
            Ticket.booking_id == booking_id
        )

        return db.scalar(statement)

    def get_by_qr_token(
        self,
        db: Session,
        qr_token: str,
    ):
        statement = select(Ticket).where(
            Ticket.qr_token == qr_token
        )

        return db.scalar(statement)

    def get_by_qr_token_for_update(
        self,
        db: Session,
        qr_token: str,
    ):
        statement = (
            select(Ticket)
            .where(Ticket.qr_token == qr_token)
            .with_for_update()
        )

        return db.scalar(statement)