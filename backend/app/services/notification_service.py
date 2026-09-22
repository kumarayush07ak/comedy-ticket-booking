from sqlalchemy.orm import Session

from app.repositories.notification_repository import NotificationRepository


class NotificationService:

    def __init__(self, db: Session):
        self.db = db
        self.repository = NotificationRepository()

    def create_notification(
        self,
        user_id: int,
        notification_type: str,
        title: str,
        message: str,
        related_booking_id: int | None = None,
        related_event_id: int | None = None,
    ):
        return self.repository.create(
            db=self.db,
            user_id=user_id,
            notification_type=notification_type,
            title=title,
            message=message,
            related_booking_id=related_booking_id,
            related_event_id=related_event_id,
        )

    def get_user_notifications(
        self,
        user_id: int,
    ):
        return self.repository.get_user_notifications(
            db=self.db,
            user_id=user_id,
        )

    def mark_as_read(
        self,
        notification_id: int,
        user_id: int,
    ):
        notification = self.repository.get_by_id(
            db=self.db,
            notification_id=notification_id,
        )

        if not notification or notification.user_id != user_id:
            return None

        return self.repository.mark_as_read(
            db=self.db,
            notification=notification,
        )