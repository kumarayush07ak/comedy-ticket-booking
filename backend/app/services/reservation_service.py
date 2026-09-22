import json
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from sqlalchemy import select

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Event, SeatStatus, EventSeat
from app.repositories.event_repository import EventRepository
from app.schemas.reservation import (
    ReservationHoldRequest,
    ReservationHoldResponse,
)

RESERVATION_METADATA_EXTRA_SECONDS = 300

class ReservationService:
    def __init__(self, db: Session, redis_client):
        self.db = db
        self.redis = redis_client
        self.event_repository = EventRepository()
        self.expired_reservation_notifications = []

    def _generate_reservation_id(self) -> str:
        return str(uuid4())

    def _get_hold_key(
        self,
        event_id: int,
        seat_id: int,
    ) -> str:
        return f"reservation:hold:event:{event_id}:seat:{seat_id}"

    def _get_reservation_key(
        self,
        reservation_id: str,
    ) -> str:
        return f"reservation:{reservation_id}"

    def _get_expiration_time(self) -> datetime:
        return datetime.now(timezone.utc) + timedelta(
            minutes=settings.seat_hold_minutes
        )

    def create_hold(
        self,
        user_id: int,
        request: ReservationHoldRequest,
    ) -> ReservationHoldResponse:

        # 1. Reject duplicate seat IDs.
        if len(request.seat_ids) != len(set(request.seat_ids)):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Duplicate seat IDs are not allowed",
            )

        # 2. Verify event exists.
        event = self.db.get(Event, request.event_id)

        if event is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found",
            )

        # 3. Lock all requested EventSeat rows.
        event_seats = self.event_repository.get_event_seats_for_update(
            self.db,
            request.event_id,
            request.seat_ids,
        )

        # 4. Make sure every requested seat belongs to this event.
        if len(event_seats) != len(request.seat_ids):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="One or more seats do not belong to this event",
            )

        event_seats_by_seat_id = {
            event_seat.seat_id: event_seat
            for event_seat in event_seats
        }

        # 5. Check PostgreSQL state.
        for seat_id in request.seat_ids:
            event_seat = event_seats_by_seat_id[seat_id]

            if event_seat.status != SeatStatus.AVAILABLE:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Seat {seat_id} is not available",
                )

        reservation_id = self._generate_reservation_id()
        redis_keys: list[str] = []

        try:
            # 6. Acquire Redis locks atomically using SET NX.
            for seat_id in request.seat_ids:
                hold_key = self._get_hold_key(
                    request.event_id,
                    seat_id,
                )

                acquired = self.redis.set(
                    hold_key,
                    f"{reservation_id}:{user_id}",
                    nx=True,
                    ex=settings.seat_hold_minutes * 60,
                )

                if not acquired:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=f"Seat {seat_id} is already held",
                    )

                redis_keys.append(hold_key)

            # 7. Mark all EventSeats as HELD.
            for event_seat in event_seats:
                event_seat.status = SeatStatus.HELD

            self.db.flush()

            # 8. Store reservation metadata in Redis.
            expires_at = self._get_expiration_time()

            reservation_key = self._get_reservation_key(
                reservation_id
            )

            reservation_data = {
                "reservation_id": reservation_id,
                "user_id": user_id,
                "event_id": request.event_id,
                "seat_ids": request.seat_ids,
                "expires_at": expires_at.isoformat(),
            }

            self.redis.set(
                reservation_key,
                json.dumps(reservation_data),
                ex=(settings.seat_hold_minutes * 60+RESERVATION_METADATA_EXTRA_SECONDS),
            )

            redis_keys.append(reservation_key)

            # 9. Commit PostgreSQL before returning success.
            self.db.commit()

        except Exception:
            # Roll back PostgreSQL changes.
            self.db.rollback()

            # Remove every Redis key created by this attempt.
            if redis_keys:
                self.redis.delete(*redis_keys)

            raise

        return ReservationHoldResponse(
            reservation_id=reservation_id,
            event_id=request.event_id,
            seat_ids=request.seat_ids,
            expires_at=expires_at,
            hold_minutes=settings.seat_hold_minutes,
        )

    def release_expired_holds(self) -> int:
        """
        Release EventSeat records whose Redis reservation hold has expired.

        PostgreSQL remains the source of truth for seat state.
        Reservation metadata is retained briefly after the seat hold expires
        so the customer can be notified about the expired reservation.
        """
        expired_count = 0
        notification_map = {}

        held_seats = (
            self.db.execute(
                select(EventSeat)
                .where(EventSeat.status == SeatStatus.HELD)
                .with_for_update()
            )
            .scalars()
            .all()
        )

        for event_seat in held_seats:
            hold_key = self._get_hold_key(
                event_seat.event_id,
                event_seat.seat_id,
            )

            if not self.redis.exists(hold_key):
                reservation_id = None

                # Find the reservation that owns this seat.
                reservation_keys = self.redis.keys("reservation:*")

                for reservation_key in reservation_keys:
                    # Skip seat hold keys.
                    if ":hold:" in reservation_key:
                        continue

                    reservation_data = self.redis.get(reservation_key)

                    if not reservation_data:
                        continue

                    try:
                        reservation = json.loads(reservation_data)
                    except json.JSONDecodeError:
                        continue

                    if (
                        reservation.get("event_id") == event_seat.event_id
                        and event_seat.seat_id
                        in reservation.get("seat_ids", [])
                    ):
                        reservation_id = reservation.get("reservation_id")
                        user_id = reservation.get("user_id")

                        if reservation_id and user_id:
                            notification_map[reservation_id] = {
                                "user_id": int(user_id),
                                "reservation_id": reservation_id,
                                "event_id": event_seat.event_id,
                            }

                        break

                event_seat.status = SeatStatus.AVAILABLE
                expired_count += 1

        self.expired_reservation_notifications = list(
            notification_map.values()
        )

        if expired_count:
            self.db.commit()

        return expired_count