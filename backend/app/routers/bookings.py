from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.dependencies.auth import require_customer
from app.dependencies.database import get_db
from app.redis_client import get_redis
from app.models import User
from app.schemas.booking import BookingCreateRequest, BookingResponse
from app.services.booking_service import BookingService


router = APIRouter(
    prefix="/bookings",
    tags=["Bookings"],
)

@router.get(
    "/my-bookings",
    response_model=list[BookingResponse],
)
def get_my_bookings(
    db: Session = Depends(get_db),
    redis_client=Depends(get_redis),
    current_user: User = Depends(require_customer),
):
    service = BookingService(
        db=db,
        redis_client=redis_client,
    )

    return service.get_user_bookings(
        user_id=current_user.id,
    )


@router.post(
    "",
    response_model=BookingResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_booking(
    request: BookingCreateRequest,
    db: Session = Depends(get_db),
    redis_client=Depends(get_redis),
    current_user: User = Depends(require_customer),
):
    service = BookingService(
        db=db,
        redis_client=redis_client,
    )

    return service.create_booking(
        user_id=current_user.id,
        request=request,
    )