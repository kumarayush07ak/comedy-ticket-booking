from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import City, Venue
from app.repositories.venue_repository import VenueRepository
from app.schemas.venue import VenueCreateRequest, VenueUpdateRequest


class VenueService:
    def __init__(self, db: Session):
        self.db = db
        self.venue_repository = VenueRepository(db)

    def _validate_city(self, city_id: int) -> None:
        city = self.db.get(City, city_id)

        if city is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="City not found",
            )

    def create_venue(self, data: VenueCreateRequest) -> Venue:
        self._validate_city(data.city_id)

        name = data.name.strip()

        existing_venue = self.venue_repository.get_by_name_and_city(
            name=name,
            city_id=data.city_id,
        )

        if existing_venue:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Venue already exists in this city",
            )

        return self.venue_repository.create(
            name=name,
            city_id=data.city_id,
            address=data.address.strip(),
            description=data.description.strip()
            if data.description
            else None,
        )

    def get_venue(self, venue_id: int) -> Venue:
        venue = self.venue_repository.get_by_id(venue_id)

        if venue is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Venue not found",
            )

        return venue

    def get_all_venues(self) -> list[Venue]:
        return self.venue_repository.get_all()

    def get_venues_by_city(self, city_id: int) -> list[Venue]:
        self._validate_city(city_id)
        return self.venue_repository.get_by_city_id(city_id)

    def update_venue(
        self,
        venue_id: int,
        data: VenueUpdateRequest,
    ) -> Venue:
        venue = self.get_venue(venue_id)

        self._validate_city(data.city_id)

        name = data.name.strip()

        existing_venue = self.venue_repository.get_by_name_and_city(
            name=name,
            city_id=data.city_id,
        )

        if existing_venue and existing_venue.id != venue_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Venue already exists in this city",
            )

        return self.venue_repository.update(
            venue=venue,
            name=name,
            city_id=data.city_id,
            address=data.address.strip(),
            description=data.description.strip()
            if data.description
            else None,
        )

    def delete_venue(self, venue_id: int) -> None:
        venue = self.get_venue(venue_id)

        if venue.events:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Venue cannot be deleted because it has events",
            )

        self.venue_repository.delete(venue)