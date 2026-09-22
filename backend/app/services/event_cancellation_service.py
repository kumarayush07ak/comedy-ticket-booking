from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import (
    Booking,
    Event,
    BookingStatus,
    EventSeat,
    EventStatus,
    PaymentStatus,
    SeatStatus,
    TicketStatus,
)
from app.repositories.booking_repository import BookingRepository
from app.repositories.payment_repository import PaymentRepository
from app.repositories.ticket_repository import TicketRepository
from app.schemas.event_cancellation import EventCancellationResponse


class EventCancellationService:

    def __init__(self, db: Session):
        self.db = db
        self.booking_repository = BookingRepository()
        self.payment_repository = PaymentRepository()
        self.ticket_repository = TicketRepository()
        self.cancelled_booking_notifications = []

    def cancel_event(self, event_id: int) -> EventCancellationResponse:

        event = (
            self.db.query(Event)
            .filter(Event.id == event_id)
            .with_for_update()
            .first()
        )

        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found",
            )

        if event.status == EventStatus.CANCELLED:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Event is already cancelled",
            )

        if event.status == EventStatus.COMPLETED:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Completed event cannot be cancelled",
            )

        bookings = (
            self.db.query(Booking)
            .filter(Booking.event_id == event_id)
            .with_for_update()
            .all()
        )

        cancelled_bookings = 0
        refunded_payments = 0
        cancelled_tickets = 0

        for booking in bookings:

            if booking.status in (
                BookingStatus.PENDING,
                BookingStatus.CONFIRMED,
            ):
                booking.status = BookingStatus.CANCELLED
                cancelled_bookings += 1

                self.cancelled_booking_notifications.append(
                    (booking.user_id, booking.id)
                )

            payment = self.payment_repository.get_by_booking_id(
                self.db,
                booking.id,
            )

            if payment and payment.status == PaymentStatus.SUCCESS:
                payment.status = PaymentStatus.REFUNDED
                refunded_payments += 1

            ticket = self.ticket_repository.get_by_booking_id(
                self.db,
                booking.id,
            )

            if ticket and ticket.status == TicketStatus.ACTIVE:
                ticket.status = TicketStatus.CANCELLED
                cancelled_tickets += 1

        event_seats = (
            self.db.query(EventSeat)
            .filter(EventSeat.event_id == event_id)
            .with_for_update()
            .all()
        )

        released_seats = 0

        for event_seat in event_seats:
            if event_seat.status != SeatStatus.AVAILABLE:
                event_seat.status = SeatStatus.AVAILABLE
                released_seats += 1

        event.status = EventStatus.CANCELLED

        self.db.flush()

        return EventCancellationResponse(
            event_id=event.id,
            event_status=event.status.value,
            cancelled_bookings=cancelled_bookings,
            refunded_payments=refunded_payments,
            cancelled_tickets=cancelled_tickets,
            released_seats=released_seats,
            message="Event cancelled successfully",
        )