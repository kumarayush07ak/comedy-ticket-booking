from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.dependencies.auth import require_admin
from app.dependencies.database import get_db
from app.models import User
from app.schemas.seat import SeatLayoutCreateRequest, SeatLayoutResponse
from app.services.seat_service import SeatService


router = APIRouter(
    prefix="/venues/{venue_id}/seats",
    tags=["Seats"],
)


@router.put(
    "/layout",
    response_model=SeatLayoutResponse,
    status_code=status.HTTP_200_OK,
)
def create_or_replace_seat_layout(
    venue_id: int,
    request: SeatLayoutCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    service = SeatService(db)

    return service.create_or_replace_layout(
        venue_id=venue_id,
        request=request,
    )


@router.get(
    "/layout",
    response_model=SeatLayoutResponse,
)
def get_seat_layout(
    venue_id: int,
    db: Session = Depends(get_db),
):
    service = SeatService(db)

    return service.get_layout(venue_id)