import time

from app.database import SessionLocal
from app.redis_client import get_redis
from app.services.reservation_service import ReservationService
from app.services.notification_stream_service import (
    NotificationStreamService,
)


def run_reservation_cleanup(interval_seconds: int = 30) -> None:
    """
    Periodically release expired reservation holds.
    """

    redis_client = get_redis()

    while True:
        db = SessionLocal()

        try:
            service = ReservationService(
                db=db,
                redis_client=redis_client,
            )

            released = service.release_expired_holds()

            if released:
                print(
                    f"[Reservation Cleanup] Released {released} expired seat(s)."
                )

                notification_service = NotificationStreamService()

                for notification in service.expired_reservation_notifications:
                    notification_service.publish(
                        user_id=notification["user_id"],
                        notification_type="RESERVATION_EXPIRED",
                        title="Reservation Expired",
                        message=(
                            f"Your seat reservation for event "
                            f"#{notification['event_id']} has expired. "
                            "The held seats have been released."
                        ),
                        related_event_id=notification["event_id"],
                    )

        except Exception as exc:
            db.rollback()
            print(
                f"[Reservation Cleanup] Error: {exc}"
            )

        finally:
            db.close()

        time.sleep(interval_seconds)

if __name__ == "__main__":
    print("[Reservation Cleanup] Worker started.")
    run_reservation_cleanup()