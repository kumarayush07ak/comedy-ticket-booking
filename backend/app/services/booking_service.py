from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Event, EventSeat, SeatStatus, Booking
from app.repositories.booking_repository import BookingRepository
from app.repositories.event_repository import EventRepository
from app.schemas.booking import (
    BookingCreateRequest,
    BookingItemResponse,
    BookingResponse,
)


class BookingService:
    def __init__(self, db: Session, redis_client):
        self.db = db
        self.redis = redis_client
        self.booking_repository = BookingRepository()
        self.event_repository = EventRepository()

    def _get_hold_key(self, event_id: int, seat_id: int) -> str:
        return f"reservation:hold:event:{event_id}:seat:{seat_id}"

    def _build_response(self, booking: Booking) -> BookingResponse:
        items = self.booking_repository.get_booking_items(
            self.db,
            booking.id,
        )

        return BookingResponse(
            id=booking.id,
            user_id=booking.user_id,
            event_id=booking.event_id,
            event_title=booking.event.title,
            total_amount=float(booking.total_amount),
            status=booking.status.value,
            created_at=booking.created_at,
            updated_at=booking.updated_at,
            items=[
                BookingItemResponse(
                    seat_id=item.seat_id,
                    seat_label=item.seat.seat_label,
                    row_label=item.seat.row_label,
                    seat_number=item.seat.seat_number,
                    price=float(item.price),
                )
                for item in items
            ],
        )

    def create_booking(
        self,
        user_id: int,
        request: BookingCreateRequest,
    ) -> BookingResponse:

        # 1. Reject duplicate seat IDs
        if len(request.seat_ids) != len(set(request.seat_ids)):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Duplicate seat IDs are not allowed",
            )

        # 2. Check event exists
        event = self.db.get(Event, request.event_id)

        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found",
            )

        # 3. Lock requested EventSeat rows
        event_seats = self.event_repository.get_event_seats_for_update(
            self.db,
            request.event_id,
            request.seat_ids,
        )

        # 4. Verify all requested seats belong to this event
        if len(event_seats) != len(request.seat_ids):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="One or more seats do not belong to this event",
            )

        event_seat_map = {
            event_seat.seat_id: event_seat
            for event_seat in event_seats
        }

        # 5. Verify Redis hold belongs to this customer
        for seat_id in request.seat_ids:
            hold_key = self._get_hold_key(
                request.event_id,
                seat_id,
            )

            hold_value = self.redis.get(hold_key)

            if not hold_value:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Seat {seat_id} hold has expired",
                )

            parts = hold_value.split(":", 1)

            if len(parts) != 2:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Invalid hold for seat {seat_id}",
                )

            _, hold_user_id = parts

            if str(hold_user_id) != str(user_id):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Seat {seat_id} is held by another customer",
                )

        # 6. Verify PostgreSQL seat state
        for seat_id in request.seat_ids:
            event_seat = event_seat_map[seat_id]

            if event_seat.status != SeatStatus.HELD:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Seat {seat_id} is not currently held",
                )

        # 7. Calculate total
        total_amount = event.ticket_price * len(request.seat_ids)

        # 8. Create pending booking
        booking = self.booking_repository.create_booking(
            self.db,
            user_id=user_id,
            event_id=request.event_id,
            total_amount=total_amount,
        )

        # 9. Create booking items
        for seat_id in request.seat_ids:
            self.booking_repository.create_booking_item(
                self.db,
                booking_id=booking.id,
                seat_id=seat_id,
                price=event.ticket_price,
            )

        # 10. Keep seats HELD until payment confirmation
        self.db.flush()
        self.db.refresh(booking)

        return self._build_response(booking)

    def get_user_bookings(
        self,
        user_id: int,
    ) -> list[BookingResponse]:
        bookings = self.booking_repository.get_user_bookings(
            self.db,
            user_id,
        )

        return [
            self._build_response(booking)
            for booking in bookings
        ]