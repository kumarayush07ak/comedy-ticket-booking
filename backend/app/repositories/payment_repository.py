from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Payment


class PaymentRepository:

    def create_payment(
        self,
        db: Session,
        booking_id: int,
        amount: float,
    ):
        payment = Payment(
            booking_id=booking_id,
            amount=amount,
        )

        db.add(payment)
        db.flush()

        return payment

    def get_by_id(
        self,
        db: Session,
        payment_id: int,
    ):
        statement = select(Payment).where(
            Payment.id == payment_id
        )

        return db.scalar(statement)

    def get_by_booking_id(
        self,
        db: Session,
        booking_id: int,
    ):
        statement = select(Payment).where(
            Payment.booking_id == booking_id
        )

        return db.scalar(statement)

    def get_by_booking_id_for_update(
        self,
        db: Session,
        booking_id: int,
    ):
        statement = (
            select(Payment)
            .where(Payment.booking_id == booking_id)
            .with_for_update()
        )

        return db.scalar(statement)