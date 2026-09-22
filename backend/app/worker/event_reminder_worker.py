import time
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import select

from app.database import SessionLocal
from app.redis_client import get_redis
from app.config import settings
from app.models import Event, EventStatus
from app.repositories.booking_repository import BookingRepository
from app.services.notification_stream_service import (
    NotificationStreamService,
)


REMINDER_KEY_PREFIX = "event:reminder:sent"


def run_event_reminder_worker(interval_seconds: int = 30) -> None:
    """
    Send event reminders approximately 2 hours before event start time.

    The worker checks a 30-second lookback window so that a reminder
    is not missed simply because the worker runs slightly after the
    exact two-hour mark.

    Redis NX prevents duplicate reminders.
    """

    redis_client = get_redis()
    booking_repository = BookingRepository()
    notification_service = NotificationStreamService()

    print("[Event Reminder] Worker started.")

    while True:
        db = SessionLocal()

        try:
            app_timezone = ZoneInfo(settings.app_timezone)

            # Use the application's configured local timezone.
            now = datetime.now(app_timezone)

            # Look back 30 seconds from the current time.
            # This allows the worker to catch a reminder even if it
            # runs slightly after the exact two-hour mark.
            reminder_window_start = now - timedelta(seconds=30)
            reminder_window_end = now

            events = (
                db.execute(
                    select(Event).where(
                        Event.status == EventStatus.UPCOMING,
                        Event.event_date.is_not(None),
                    )
                )
                .scalars()
                .all()
            )

            reminder_event_ids = []

            for event in events:
                event_datetime = datetime.combine(
                    event.event_date,
                    event.start_time,
                ).replace(tzinfo=app_timezone)

                # The reminder should be sent exactly two hours
                # before the event starts.
                reminder_datetime = event_datetime - timedelta(hours=2)

                if (
                    reminder_window_start
                    <= reminder_datetime
                    <= reminder_window_end
                ):
                    reminder_event_ids.append(event.id)

            if reminder_event_ids:
                bookings = (
                    booking_repository
                    .get_confirmed_bookings_for_upcoming_events(
                        db,
                        reminder_event_ids,
                    )
                )

                for booking in bookings:
                    reminder_key = (
                        f"{REMINDER_KEY_PREFIX}:"
                        f"{booking.event_id}:"
                        f"{booking.user_id}"
                    )

                    # Prevent duplicate reminders.
                    acquired = redis_client.set(
                        reminder_key,
                        "1",
                        nx=True,
                        ex=86400,
                    )

                    if not acquired:
                        continue

                    event = next(
                        (
                            event
                            for event in events
                            if event.id == booking.event_id
                        ),
                        None,
                    )

                    if not event:
                        continue

                    notification_service.publish(
                        user_id=booking.user_id,
                        notification_type="EVENT_REMINDER",
                        title="Event Reminder",
                        message=(
                            f"Reminder: your event "
                            f"'{event.title}' starts in approximately "
                            f"2 hours."
                        ),
                        related_booking_id=booking.id,
                        related_event_id=event.id,
                    )

                    print(
                        f"[Event Reminder] Sent reminder for "
                        f"booking #{booking.id}."
                    )

        except Exception as exc:
            db.rollback()
            print(f"[Event Reminder] Error: {exc}")

        finally:
            db.close()

        time.sleep(interval_seconds)


if __name__ == "__main__":
    run_event_reminder_worker()