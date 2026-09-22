from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.dependencies.auth import require_admin
from app.dependencies.database import get_db
from app.models import City, User
from app.schemas.city import (
    CityCreateRequest,
    CityResponse,
    CityUpdateRequest,
)
from app.services.city_service import CityService


router = APIRouter(
    prefix="/cities",
    tags=["Cities"],
)


@router.post(
    "",
    response_model=CityResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_city(
    data: CityCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    service = CityService(db)
    return service.create_city(data)


@router.get(
    "",
    response_model=list[CityResponse],
)
def get_cities(
    db: Session = Depends(get_db),
):
    service = CityService(db)
    return service.get_all_cities()


@router.get(
    "/{city_id}",
    response_model=CityResponse,
)
def get_city(
    city_id: int,
    db: Session = Depends(get_db),
):
    service = CityService(db)
    return service.get_city(city_id)


@router.put(
    "/{city_id}",
    response_model=CityResponse,
)
def update_city(
    city_id: int,
    data: CityUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    service = CityService(db)
    return service.update_city(city_id, data)


@router.delete(
    "/{city_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_city(
    city_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    service = CityService(db)
    service.delete_city(city_id)