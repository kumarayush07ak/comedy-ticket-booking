from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Seat


class SeatRepository:

    def get_by_id(self, db: Session, seat_id: int):
        return db.get(Seat, seat_id)

    def get_by_venue_id(self, db: Session, venue_id: int):
        statement = (
            select(Seat)
            .where(Seat.venue_id == venue_id)
            .order_by(Seat.row_label, Seat.seat_number)
        )
        return list(db.scalars(statement).all())

    def get_by_venue_and_label(
        self,
        db: Session,
        venue_id: int,
        seat_label: str,
    ):
        statement = select(Seat).where(
            Seat.venue_id == venue_id,
            Seat.seat_label == seat_label,
        )
        return db.scalars(statement).first()

    def create(
        self,
        db: Session,
        venue_id: int,
        row_label: str,
        seat_number: int,
        seat_label: str,
    ):
        seat = Seat(
            venue_id=venue_id,
            row_label=row_label,
            seat_number=seat_number,
            seat_label=seat_label,
        )

        db.add(seat)
        db.flush()
        db.refresh(seat)

        return seat

    def delete_by_venue_id(self, db: Session, venue_id: int):
        seats = self.get_by_venue_id(db, venue_id)

        for seat in seats:
            db.delete(seat)

        db.flush()