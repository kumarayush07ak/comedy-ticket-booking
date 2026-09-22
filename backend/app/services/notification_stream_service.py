import json

from app.redis_client import get_redis


NOTIFICATION_STREAM = "notification_events"


class NotificationStreamService:

    def __init__(self):
        self.redis = get_redis()

    def publish(
        self,
        user_id: int,
        notification_type: str,
        title: str,
        message: str,
        related_booking_id: int | None = None,
        related_event_id: int | None = None,
    ) -> str:

        event = {
            "user_id": str(user_id),
            "type": notification_type,
            "title": title,
            "message": message,
        }

        if related_booking_id is not None:
            event["related_booking_id"] = str(related_booking_id)

        if related_event_id is not None:
            event["related_event_id"] = str(related_event_id)

        message_id = self.redis.xadd(
            NOTIFICATION_STREAM,
            {
                "data": json.dumps(event),
            },
        )

        return message_id