from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies.auth import require_customer
from app.dependencies.database import get_db
from app.models import User
from app.schemas.cancellation import CancellationResponse
from app.services.cancellation_service import CancellationService
from app.services.notification_stream_service import NotificationStreamService


router = APIRouter(
    prefix="/cancellations",
    tags=["Cancellations"],
)


@router.post(
    "/bookings/{booking_id}",
    response_model=CancellationResponse,
)
def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
):
    service = CancellationService(db)

    response = service.cancel_booking(
        booking_id=booking_id,
        user_id=current_user.id,
    )

    # Commit cancellation before publishing notification
    db.commit()

    # Publish notification event to Redis Stream
    NotificationStreamService().publish(
        user_id=current_user.id,
        notification_type="BOOKING_CANCELLED",
        title="Booking Cancelled",
        message=f"Your booking #{response.booking_id} has been cancelled successfully.",
        related_booking_id=response.booking_id,
    )

    return response