from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import City, Venue
from app.repositories.city_repository import CityRepository
from app.schemas.city import CityCreateRequest, CityUpdateRequest


class CityService:
    def __init__(self, db: Session):
        self.city_repository = CityRepository(db)
        self.db = db

    def create_city(self, data: CityCreateRequest) -> City:
        existing_city = self.city_repository.get_by_name(data.name.strip())

        if existing_city:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="City already exists",
            )

        return self.city_repository.create(data.name.strip())

    def get_city(self, city_id: int) -> City:
        city = self.city_repository.get_by_id(city_id)

        if city is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="City not found",
            )

        return city

    def get_all_cities(self) -> list[City]:
        return self.city_repository.get_all()

    def update_city(
        self,
        city_id: int,
        data: CityUpdateRequest,
    ) -> City:
        city = self.get_city(city_id)
        new_name = data.name.strip()

        existing_city = self.city_repository.get_by_name(new_name)

        if existing_city and existing_city.id != city_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="City already exists",
            )

        return self.city_repository.update(city, new_name)

    def delete_city(self, city_id: int) -> None:
        city = self.get_city(city_id)

        has_venues = self.db.query(Venue.id).filter(
            Venue.city_id == city_id
        ).first()

        if has_venues:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="City cannot be deleted because it has venues",
            )

        self.city_repository.delete(city)