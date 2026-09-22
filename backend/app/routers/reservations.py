from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.dependencies.auth import require_customer
from app.dependencies.database import get_db
from app.redis_client import get_redis
from app.models import User
from app.schemas.reservation import (
    ReservationHoldRequest,
    ReservationHoldResponse,
)
from app.services.reservation_service import ReservationService


router = APIRouter(
    prefix="/reservations",
    tags=["Reservations"],
)


@router.post(
    "/hold",
    response_model=ReservationHoldResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_reservation_hold(
    request: ReservationHoldRequest,
    db: Session = Depends(get_db),
    redis_client=Depends(get_redis),
    current_user: User = Depends(require_customer),
):
    service = ReservationService(db, redis_client)

    return service.create_hold(
        user_id=current_user.id,
        request=request,
    )