from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Venue


class VenueRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, venue_id: int) -> Venue | None:
        statement = select(Venue).where(Venue.id == venue_id)
        return self.db.scalar(statement)

    def get_by_city_id(self, city_id: int) -> list[Venue]:
        statement = (
            select(Venue)
            .where(Venue.city_id == city_id)
            .order_by(Venue.name)
        )
        return list(self.db.scalars(statement).all())

    def get_all(self) -> list[Venue]:
        statement = select(Venue).order_by(Venue.name)
        return list(self.db.scalars(statement).all())

    def get_by_name_and_city(
        self,
        name: str,
        city_id: int,
    ) -> Venue | None:
        statement = select(Venue).where(
            Venue.name == name,
            Venue.city_id == city_id,
        )
        return self.db.scalar(statement)

    def create(
        self,
        name: str,
        city_id: int,
        address: str,
        description: str | None,
    ) -> Venue:
        venue = Venue(
            name=name,
            city_id=city_id,
            address=address,
            description=description,
        )
        self.db.add(venue)
        self.db.flush()
        self.db.refresh(venue)
        return venue

    def update(
        self,
        venue: Venue,
        name: str,
        city_id: int,
        address: str,
        description: str | None,
    ) -> Venue:
        venue.name = name
        venue.city_id = city_id
        venue.address = address
        venue.description = description

        self.db.flush()
        self.db.refresh(venue)

        return venue

    def delete(self, venue: Venue) -> None:
        self.db.delete(venue)
        self.db.flush()