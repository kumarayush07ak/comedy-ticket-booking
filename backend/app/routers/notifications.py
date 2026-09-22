from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies.auth import require_customer
from app.dependencies.database import get_db
from app.models import User
from app.services.notification_service import NotificationService


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"],
)


@router.get("")
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
):
    service = NotificationService(db)

    return service.get_user_notifications(
        user_id=current_user.id,
    )


@router.post("/{notification_id}/read")
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
):
    service = NotificationService(db)

    notification = service.mark_as_read(
        notification_id=notification_id,
        user_id=current_user.id,
    )

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    return {
        "message": "Notification marked as read",
        "notification_id": notification.id,
    }