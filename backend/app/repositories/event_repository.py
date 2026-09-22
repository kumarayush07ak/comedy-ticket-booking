from sqlalchemy import select, or_
from sqlalchemy.orm import Session

from app.models import (
    Event,
    EventFormat,
    EventSeat,
    EventStatus,
    Seat,
    Venue,
)
from datetime import date



class EventRepository:
    def get_by_id(self, db:Session, event_id: int):
        return db.get(Event, event_id)

    def get_all(self, db:Session):
        statement = select(Event).order_by(
            Event.event_date,
            Event.start_time,
        )
        return list(db.scalars(statement).all())

    def get_filtered(
        self,
        db: Session,
        city_id: int | None = None,
        venue_id: int | None = None,
        event_date: date | None = None,
        event_format: EventFormat | None = None,
        event_status: str | None = None,
        search: str | None = None,
    ):
        statement = (
            select(Event)
            .join(Venue, Event.venue_id == Venue.id)
        )

        if city_id is not None:
            statement = statement.where(
                Venue.city_id == city_id
            )

        if venue_id is not None:
            statement = statement.where(
                Event.venue_id == venue_id
            )

        if event_date is not None:
            statement = statement.where(
                Event.event_date == event_date
            )

        if event_format is not None:
            statement = statement.where(
                Event.event_format == event_format
            )

        if event_status is not None:
            statement = statement.where(
                Event.status == event_status.strip().upper()
            )

        if search:
            search_pattern = f"%{search.strip()}%"

            statement = statement.where(
                or_(
                    Event.title.ilike(search_pattern),
                    Event.description.ilike(search_pattern),
                    Event.organizer_name.ilike(search_pattern),
                )
            )

        statement = statement.order_by(
            Event.event_date,
            Event.start_time,
        )

        return list(db.scalars(statement).all())

    def get_by_venue_id(self, db:Session, venue_id: int):
        statement = (
            select(Event)
            .where(Event.venue_id == venue_id)
            .order_by(Event.event_date, Event.start_time)
        )
        return list(db.scalars(statement).all())

    def create(self, db:Session, event:Event):
        db.add(event)
        db.flush()
        db.refresh(event)
        return event

    def update(self, db:Session, event:Event):
        db.add(event)
        db.flush()
        db.refresh(event)
        return event

    def delete(self, db:Session, event:Event):
        db.delete(event)
        db.flush()

    def get_event_seats(
        self,
        db: Session,
        event_id: int,
    ):
        statement = (
            select(EventSeat, Seat)
            .join(Seat, EventSeat.seat_id == Seat.id)
            .where(EventSeat.event_id == event_id)
            .order_by(
                Seat.row_label,
                Seat.seat_number,
            )
        )

        return db.execute(statement).all()

    def get_event_seats_for_update(
        self,
        db: Session,
        event_id: int,
        seat_ids: list[int],
    ):
        statement = (
            select(EventSeat)
            .where(
                EventSeat.event_id == event_id,
                EventSeat.seat_id.in_(seat_ids),
            )
            .order_by(EventSeat.seat_id)
            .with_for_update()
        )

        return list(db.scalars(statement).all())