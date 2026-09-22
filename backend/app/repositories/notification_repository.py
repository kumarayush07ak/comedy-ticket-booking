from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Notification


class NotificationRepository:

    def create(
        self,
        db: Session,
        user_id: int,
        notification_type: str,
        title: str,
        message: str,
        related_booking_id: int | None = None,
        related_event_id: int | None = None,
    ) -> Notification:

        notification = Notification(
            user_id=user_id,
            type=notification_type,
            title=title,
            message=message,
            related_booking_id=related_booking_id,
            related_event_id=related_event_id,
        )

        db.add(notification)
        db.flush()

        return notification

    def get_by_id(
        self,
        db: Session,
        notification_id: int,
    ) -> Notification | None:

        return db.get(Notification, notification_id)

    def get_user_notifications(
        self,
        db: Session,
        user_id: int,
    ) -> list[Notification]:

        statement = (
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
        )

        return list(db.scalars(statement).all())

    def mark_as_read(
        self,
        db: Session,
        notification: Notification,
    ) -> Notification:

        from datetime import datetime, timezone

        notification.is_read = True
        notification.read_at = datetime.now(timezone.utc)

        db.flush()

        return notification