from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import (
    Booking,
    BookingStatus,
    City,
    Event,
    EventSeat,
    EventStatus,
    Payment,
    PaymentStatus,
    SeatStatus,
    Ticket,
    TicketStatus,
    User,
    UserRole,
    Venue,
)


class AdminDashboardRepository:
    def count_customers(self, db: Session) -> int:
        statement = select(func.count(User.id)).where(
            User.role == UserRole.CUSTOMER
        )
        return int(db.scalar(statement) or 0)

    def count_cities(self, db: Session) -> int:
        statement = select(func.count(City.id))
        return int(db.scalar(statement) or 0)

    def count_venues(self, db: Session) -> int:
        statement = select(func.count(Venue.id))
        return int(db.scalar(statement) or 0)

    def count_upcoming_events(self, db: Session) -> int:
        statement = select(func.count(Event.id)).where(
            Event.status == EventStatus.UPCOMING
        )
        return int(db.scalar(statement) or 0)

    def count_bookings(self, db: Session) -> int:
        statement = select(func.count(Booking.id))
        return int(db.scalar(statement) or 0)

    def count_confirmed_bookings(self, db: Session) -> int:
        statement = select(func.count(Booking.id)).where(
            Booking.status == BookingStatus.CONFIRMED
        )
        return int(db.scalar(statement) or 0)

    def calculate_revenue(self, db: Session) -> int:
        statement = select(
            func.coalesce(func.sum(Payment.amount), 0)
        ).where(
            Payment.status == PaymentStatus.SUCCESS
        )
        return int(db.scalar(statement) or 0)

    def count_available_seats(self, db: Session) -> int:
        statement = (
            select(func.count(EventSeat.id))
            .join(Event, Event.id == EventSeat.event_id)
            .where(
                Event.status == EventStatus.UPCOMING,
                EventSeat.status == SeatStatus.AVAILABLE,
            )
        )
        return int(db.scalar(statement) or 0)

    def count_scanned_tickets(self, db: Session) -> int:
        statement = select(func.count(Ticket.id)).where(
            Ticket.status == TicketStatus.USED
        )
        return int(db.scalar(statement) or 0)