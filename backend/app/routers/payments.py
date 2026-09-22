from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.dependencies.auth import require_customer
from app.dependencies.database import get_db
from app.redis_client import get_redis
from app.models import User
from app.schemas.payment import PaymentCreateRequest, PaymentResponse
from app.services.payment_service import PaymentService
from app.services.notification_stream_service import NotificationStreamService


router = APIRouter(
    prefix="/payments",
    tags=["Payments"],
)


@router.post(
    "",
    response_model=PaymentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_payment(
    request: PaymentCreateRequest,
    db: Session = Depends(get_db),
    redis_client=Depends(get_redis),
    current_user: User = Depends(require_customer),
):
    service = PaymentService(
        db=db,
        redis_client=redis_client,
    )

    payment = service.process_payment(
        user_id=current_user.id,
        request=request,
    )

    # Commit payment, booking, seat, and ticket changes first.
    db.commit()

    # Publish notification only after the database transaction succeeds.
    NotificationStreamService().publish(
        user_id=current_user.id,
        notification_type="BOOKING_CONFIRMED",
        title="Booking Confirmed",
        message=(
            f"Your booking #{payment.booking_id} has been confirmed "
            "and your payment was successful."
        ),
        related_booking_id=payment.booking_id,
    )

    return payment