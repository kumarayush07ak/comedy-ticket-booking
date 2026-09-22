from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies.auth import require_admin
from app.dependencies.database import get_db
from app.models import User
from app.schemas.event_cancellation import EventCancellationResponse
from app.services.event_cancellation_service import EventCancellationService
from app.services.notification_stream_service import NotificationStreamService


router = APIRouter(
    prefix="/event-cancellations",
    tags=["Event Cancellations"],
)


@router.post(
    "/{event_id}",
    response_model=EventCancellationResponse,
)
def cancel_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    service = EventCancellationService(db)

    response = service.cancel_event(event_id)

    # Commit event cancellation before publishing notifications
    db.commit()

    # Publish notification for every cancelled booking
    for user_id, booking_id in service.cancelled_booking_notifications:
        NotificationStreamService().publish(
            user_id=user_id,
            notification_type="EVENT_CANCELLED",
            title="Event Cancelled",
            message=(
                f"The event for your booking #{booking_id} has been cancelled. "
                "Your payment has been refunded."
            ),
            related_booking_id=booking_id,
            related_event_id=response.event_id,
        )

    return response