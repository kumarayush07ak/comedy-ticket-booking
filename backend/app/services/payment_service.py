from uuid import uuid4
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import BookingStatus, PaymentStatus, EventSeat, SeatStatus
from app.repositories.booking_repository import BookingRepository
from app.repositories.payment_repository import PaymentRepository
from app.schemas.payment import PaymentCreateRequest, PaymentResponse
from app.services.ticket_service import TicketService


class PaymentService:
    def __init__(self, db: Session, redis_client):
        self.db = db
        self.redis = redis_client
        self.payment_repository = PaymentRepository()
        self.booking_repository = BookingRepository()
        self.ticket_service = TicketService(db)

    def _generate_transaction_id(self) -> str:
        return f"TXN-{uuid4()}"

    def _build_response(self, payment) -> PaymentResponse:
        return PaymentResponse(
            id=payment.id,
            booking_id=payment.booking_id,
            amount=float(payment.amount),
            status=payment.status.value,
            transaction_id=payment.transaction_id,
            created_at=payment.created_at,
        )

    def process_payment(
        self,
        user_id: int,
        request: PaymentCreateRequest,
    ) -> PaymentResponse:

        # 1. Find the booking belonging to this customer
        booking = self.booking_repository.get_user_booking(
            self.db,
            request.booking_id,
            user_id,
        )

        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found",
            )

        # 2. Lock the booking row
        booking = self.booking_repository.get_by_id_for_update(
            self.db,
            request.booking_id,
        )

        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found",
            )

        # 3. Check whether payment already exists
        payment = self.payment_repository.get_by_booking_id(
            self.db,
            booking.id,
        )

        if payment:
            # Idempotency:
            # Returning the existing payment prevents duplicate payment records.
            return self._build_response(payment)

        # 4. Payment is only allowed for PENDING bookings
        if booking.status != BookingStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Booking is {booking.status.value} and cannot be paid",
            )

        # 5. Create simulated successful payment
        transaction_id = self._generate_transaction_id()

        payment = self.payment_repository.create_payment(
            self.db,
            booking_id=booking.id,
            amount=booking.total_amount,
        )

        payment.status = PaymentStatus.SUCCESS
        payment.transaction_id = transaction_id

        # 6. Confirm the booking
        booking.status = BookingStatus.CONFIRMED

        # 7. Get booking items
        booking_items = self.booking_repository.get_booking_items(
            self.db,
            booking.id,
        )

        # 8. Change the booked seats from HELD to BOOKED
        for item in booking_items:
            event_seat = self.db.query(EventSeat).filter(
                EventSeat.event_id == booking.event_id,
                EventSeat.seat_id == item.seat_id,
            ).with_for_update().first()

            if not event_seat:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Event seat {item.seat_id} not found",
                )

            if event_seat.status != SeatStatus.HELD:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Seat {item.seat_id} is no longer held",
                )

            event_seat.status = SeatStatus.BOOKED

        # 9. Generate ticket
        self.ticket_service.create_ticket_for_confirmed_booking(
            booking.id
        )

        self.db.flush()
        self.db.refresh(payment)

        return self._build_response(payment)

    