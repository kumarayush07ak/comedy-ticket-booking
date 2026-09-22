from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Booking, BookingItem, BookingStatus


class BookingRepository:
    def create_booking(
        self,
        db: Session,
        user_id: int,
        event_id: int,
        total_amount: float,
    ) -> Booking:
        booking = Booking(
            user_id=user_id,
            event_id=event_id,
            total_amount=total_amount,
            status=BookingStatus.PENDING,
        )

        db.add(booking)
        db.flush()

        return booking

    def create_booking_item(
        self,
        db: Session,
        booking_id: int,
        seat_id: int,
        price: float,
    ) -> BookingItem:
        item = BookingItem(
            booking_id=booking_id,
            seat_id=seat_id,
            price=price,
        )

        db.add(item)
        db.flush()

        return item

    def get_by_id(
        self,
        db: Session,
        booking_id: int,
    ) -> Booking | None:
        statement = select(Booking).where(
            Booking.id == booking_id
        )

        return db.scalar(statement)

    def get_by_id_for_update(
        self,
        db: Session,
        booking_id: int,
    ) -> Booking | None:
        statement = (
            select(Booking)
            .where(Booking.id == booking_id)
            .with_for_update()
        )

        return db.scalar(statement)

    def get_user_booking(
        self,
        db: Session,
        booking_id: int,
        user_id: int,
    ) -> Booking | None:
        statement = select(Booking).where(
            Booking.id == booking_id,
            Booking.user_id == user_id,
        )

        return db.scalar(statement)

    def get_booking_items(
        self,
        db: Session,
        booking_id: int,
    ) -> list[BookingItem]:
        statement = (
            select(BookingItem)
            .where(BookingItem.booking_id == booking_id)
            .order_by(BookingItem.id)
        )

        return list(db.scalars(statement).all())

    def get_confirmed_bookings_for_upcoming_events(
        self,
        db: Session,
        event_ids: list[int],
    ) -> list[Booking]:
        statement = (
            select(Booking)
            .where(
                Booking.event_id.in_(event_ids),
                Booking.status == BookingStatus.CONFIRMED,
            )
            .order_by(Booking.id)
        )

        return list(db.scalars(statement).all())

    def get_confirmed_bookings_for_upcoming_events(
        self,
        db: Session,
        event_ids: list[int],
    ) -> list[Booking]:
        if not event_ids:
            return []

        statement = (
            select(Booking)
            .where(
                Booking.event_id.in_(event_ids),
                Booking.status == BookingStatus.CONFIRMED,
            )
            .order_by(Booking.id)
        )

        return list(db.scalars(statement).all())

    def get_user_bookings(
        self,
        db: Session,
        user_id: int,
    ) -> list[Booking]:
        statement = (
            select(Booking)
            .where(Booking.user_id == user_id)
            .order_by(Booking.created_at.desc())
        )

        return list(db.scalars(statement).all())