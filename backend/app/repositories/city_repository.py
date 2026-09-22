from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import City


class CityRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, city_id: int) -> City | None:
        statement = select(City).where(City.id == city_id)
        return self.db.scalar(statement)

    def get_by_name(self, name: str) -> City | None:
        statement = select(City).where(City.name == name)
        return self.db.scalar(statement)

    def get_all(self) -> list[City]:
        statement = select(City).order_by(City.name)
        return list(self.db.scalars(statement).all())

    def create(self, name: str) -> City:
        city = City(name=name)
        self.db.add(city)
        self.db.flush()
        self.db.refresh(city)
        return city

    def update(self, city: City, name: str) -> City:
        city.name = name
        self.db.flush()
        self.db.refresh(city)
        return city

    def delete(self, city: City) -> None:
        self.db.delete(city)
        self.db.flush()