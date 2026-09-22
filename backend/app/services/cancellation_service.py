from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import (
    BookingStatus,
    EventSeat,
    PaymentStatus,
    SeatStatus,
    TicketStatus,
)
from app.repositories.booking_repository import BookingRepository
from app.repositories.payment_repository import PaymentRepository
from app.repositories.ticket_repository import TicketRepository
from app.schemas.cancellation import CancellationResponse


class CancellationService:

    def __init__(self, db: Session):
        self.db = db
        self.booking_repository = BookingRepository()
        self.payment_repository = PaymentRepository()
        self.ticket_repository = TicketRepository()

    def cancel_booking(
        self,
        booking_id: int,
        user_id: int,
    ) -> CancellationResponse:

        booking = self.booking_repository.get_user_booking(
            self.db,
            booking_id,
            user_id,
        )

        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found",
            )

        booking = self.booking_repository.get_by_id_for_update(
            self.db,
            booking_id,
        )

        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found",
            )

        if booking.status == BookingStatus.CANCELLED:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Booking is already cancelled",
            )

        if booking.status not in (
            BookingStatus.PENDING,
            BookingStatus.CONFIRMED,
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Booking cannot be cancelled",
            )

        booking_items = self.booking_repository.get_booking_items(
            self.db,
            booking_id,
        )

        # Release seats
        for item in booking_items:
            event_seat = (
                self.db.query(EventSeat)
                .filter(
                    EventSeat.event_id == booking.event_id,
                    EventSeat.seat_id == item.seat_id,
                )
                .with_for_update()
                .first()
            )

            if event_seat and event_seat.status in (
                SeatStatus.HELD,
                SeatStatus.BOOKED,
            ):
                event_seat.status = SeatStatus.AVAILABLE

        # Cancel booking
        booking.status = BookingStatus.CANCELLED

        # Refund payment
        payment = self.payment_repository.get_by_booking_id(
            self.db,
            booking_id,
        )

        payment_status = None

        if payment:
            if payment.status == PaymentStatus.SUCCESS:
                payment.status = PaymentStatus.REFUNDED

            payment_status = payment.status.value

        # Cancel ticket
        ticket = self.ticket_repository.get_by_booking_id(
            self.db,
            booking_id,
        )

        if ticket and ticket.status == TicketStatus.ACTIVE:
            ticket.status = TicketStatus.CANCELLED

        self.db.flush()

        return CancellationResponse(
            booking_id=booking.id,
            booking_status=booking.status.value,
            payment_status=payment_status,
            message="Booking cancelled successfully",
        )