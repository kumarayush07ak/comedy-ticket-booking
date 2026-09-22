import json


from app.database import SessionLocal
from app.redis_client import get_redis
from app.services.notification_service import NotificationService
from app.services.notification_stream_service import NOTIFICATION_STREAM


CONSUMER_GROUP = "notification_workers"
CONSUMER_NAME = "notification_worker_1"


def create_consumer_group(redis_client) -> None:
    try:
        redis_client.xgroup_create(
            name=NOTIFICATION_STREAM,
            groupname=CONSUMER_GROUP,
            id="0",
            mkstream=True,
        )
    except Exception as exc:
        if "BUSYGROUP" not in str(exc):
            raise


def run_notification_worker() -> None:
    redis_client = get_redis()

    create_consumer_group(redis_client)

    print("[Notification Worker] Worker started.")

    while True:
        try:
            messages = redis_client.xreadgroup(
                groupname=CONSUMER_GROUP,
                consumername=CONSUMER_NAME,
                streams={
                    NOTIFICATION_STREAM: ">",
                },
                count=10,
                block=1000,
            )

            if not messages:
                continue

            for _, stream_messages in messages:
                for message_id, fields in stream_messages:
                    db = SessionLocal()

                    try:
                        data = json.loads(fields["data"])

                        service = NotificationService(db)

                        service.create_notification(
                            user_id=int(data["user_id"]),
                            notification_type=data["type"],
                            title=data["title"],
                            message=data["message"],
                            related_booking_id=(
                                int(data["related_booking_id"])
                                if data.get("related_booking_id")
                                else None
                            ),
                            related_event_id=(
                                int(data["related_event_id"])
                                if data.get("related_event_id")
                                else None
                            ),
                        )

                        db.commit()

                        redis_client.xack(
                            NOTIFICATION_STREAM,
                            CONSUMER_GROUP,
                            message_id,
                        )

                        print(
                            f"[Notification Worker] Processed {message_id}"
                        )

                    except Exception as exc:
                        db.rollback()

                        print(
                            f"[Notification Worker] Error processing "
                            f"{message_id}: {exc}"
                        )

                    finally:
                        db.close()

        except Exception as exc:
            print(
                f"[Notification Worker] Redis error: {exc}"
            )


if __name__ == "__main__":
    run_notification_worker()