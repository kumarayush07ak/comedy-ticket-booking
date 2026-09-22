from datetime import datetime
from enum import Enum

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum as SQLEnum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    Time,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


# =========================================================
# ENUMS
# =========================================================


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    CUSTOMER = "CUSTOMER"


class EventFormat(str, Enum):
    STANDUP = "STANDUP"
    OPEN_MIC = "OPEN_MIC"
    IMPROV = "IMPROV"
    COMEDY_SHOW = "COMEDY_SHOW"


class EventStatus(str, Enum):
    UPCOMING = "UPCOMING"
    LIVE = "LIVE"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class SeatStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    HELD = "HELD"
    BOOKED = "BOOKED"


class BookingStatus(str, Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"


class PaymentStatus(str, Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"


class TicketStatus(str, Enum):
    ACTIVE = "ACTIVE"
    USED = "USED"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"


# =========================================================
# USER
# =========================================================


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    role: Mapped[UserRole] = mapped_column(
        SQLEnum(UserRole),
        nullable=False,
        default=UserRole.CUSTOMER,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )
    email_verified: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )
    email_verification_token_hash: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    email_verification_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    bookings = relationship(
        "Booking",
        back_populates="user",
    )

    notifications = relationship(
        "Notification",
        back_populates="user",
    )


# =========================================================
# CITY
# =========================================================


class City(Base):
    __tablename__ = "cities"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    venues = relationship(
        "Venue",
        back_populates="city",
    )


# =========================================================
# VENUE
# =========================================================


class Venue(Base):
    __tablename__ = "venues"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    city_id: Mapped[int] = mapped_column(
        ForeignKey("cities.id"),
        nullable=False,
        index=True,
    )

    address: Mapped[str] = mapped_column(
        String(300),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    city = relationship(
        "City",
        back_populates="venues",
    )

    seats = relationship(
        "Seat",
        back_populates="venue",
        cascade="all, delete-orphan",
    )

    events = relationship(
        "Event",
        back_populates="venue",
    )


# =========================================================
# PHYSICAL SEAT
# =========================================================


class Seat(Base):
    __tablename__ = "seats"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    venue_id: Mapped[int] = mapped_column(
        ForeignKey("venues.id"),
        nullable=False,
        index=True,
    )

    row_label: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
    )

    seat_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    seat_label: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    venue = relationship(
        "Venue",
        back_populates="seats",
    )

    event_seats = relationship(
        "EventSeat",
        back_populates="seat",
    )

    __table_args__ = (
        UniqueConstraint(
            "venue_id",
            "seat_label",
            name="uq_venue_seat_label",
        ),
    )

# =========================================================
# EVENT
# =========================================================


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    event_format: Mapped[EventFormat] = mapped_column(
        SQLEnum(EventFormat),
        nullable=False,
        index=True,
    )

    venue_id: Mapped[int] = mapped_column(
        ForeignKey("venues.id"),
        nullable=False,
        index=True,
    )

    event_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )

    start_time = mapped_column(Time, nullable=False)
    end_time = mapped_column(Time, nullable=False)

    ticket_price: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    poster_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    organizer_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    organizer_email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    organizer_phone: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    status: Mapped[EventStatus] = mapped_column(
        SQLEnum(EventStatus),
        nullable=False,
        default=EventStatus.UPCOMING,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    venue = relationship(
        "Venue",
        back_populates="events",
    )

    event_seats = relationship(
        "EventSeat",
        back_populates="event",
    )

    bookings = relationship(
        "Booking",
        back_populates="event",
    )


# =========================================================
# EVENT SEAT
# =========================================================


class EventSeat(Base):
    __tablename__ = "event_seats"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    event_id: Mapped[int] = mapped_column(
        ForeignKey("events.id"),
        nullable=False,
        index=True,
    )

    seat_id: Mapped[int] = mapped_column(
        ForeignKey("seats.id"),
        nullable=False,
        index=True,
    )

    status: Mapped[SeatStatus] = mapped_column(
        SQLEnum(SeatStatus),
        nullable=False,
        default=SeatStatus.AVAILABLE,
        index=True,
    )

    event = relationship(
        "Event",
        back_populates="event_seats",
    )

    seat = relationship(
        "Seat",
        back_populates="event_seats",
    )

    __table_args__ = (
        UniqueConstraint(
            "event_id",
            "seat_id",
            name="uq_event_seat",
        ),
    )


# =========================================================
# BOOKING
# =========================================================


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    event_id: Mapped[int] = mapped_column(
        ForeignKey("events.id"),
        nullable=False,
        index=True,
    )

    total_amount: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    status: Mapped[BookingStatus] = mapped_column(
        SQLEnum(BookingStatus),
        nullable=False,
        default=BookingStatus.PENDING,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    user = relationship(
        "User",
        back_populates="bookings",
    )

    event = relationship(
        "Event",
        back_populates="bookings",
    )

    booking_items = relationship(
        "BookingItem",
        back_populates="booking",
        cascade="all, delete-orphan",
    )

    payment = relationship(
        "Payment",
        back_populates="booking",
        uselist=False,
    )

    ticket = relationship(
        "Ticket",
        back_populates="booking",
        uselist=False,
    )


# =========================================================
# BOOKING ITEM
# =========================================================


class BookingItem(Base):
    __tablename__ = "booking_items"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    booking_id: Mapped[int] = mapped_column(
        ForeignKey("bookings.id"),
        nullable=False,
        index=True,
    )

    seat_id: Mapped[int] = mapped_column(
        ForeignKey("seats.id"),
        nullable=False,
        index=True,
    )

    price: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    booking = relationship(
        "Booking",
        back_populates="booking_items",
    )

    seat = relationship(
        "Seat",
    )

    __table_args__ = (
        UniqueConstraint(
            "booking_id",
            "seat_id",
            name="uq_booking_seat",
        ),
    )


# =========================================================
# PAYMENT
# =========================================================


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    booking_id: Mapped[int] = mapped_column(
        ForeignKey("bookings.id"),
        nullable=False,
        unique=True,
        index=True,
    )

    amount: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    status: Mapped[PaymentStatus] = mapped_column(
        SQLEnum(PaymentStatus),
        nullable=False,
        default=PaymentStatus.PENDING,
        index=True,
    )

    transaction_id: Mapped[str | None] = mapped_column(
        String(100),
        unique=True,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    booking = relationship(
        "Booking",
        back_populates="payment",
    )


# =========================================================
# TICKET
# =========================================================


class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    booking_id: Mapped[int] = mapped_column(
        ForeignKey("bookings.id"),
        nullable=False,
        unique=True,
        index=True,
    )

    ticket_number: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
    )

    qr_token: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    status: Mapped[TicketStatus] = mapped_column(
        SQLEnum(TicketStatus),
        nullable=False,
        default=TicketStatus.ACTIVE,
        index=True,
    )

    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    used_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    booking = relationship(
        "Booking",
        back_populates="ticket",
    )


# =========================================================
# NOTIFICATION
# =========================================================


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    message: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    is_read: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        index=True,
    )

    related_booking_id: Mapped[int | None] = mapped_column(
        ForeignKey("bookings.id"),
        nullable=True,
    )

    related_event_id: Mapped[int | None] = mapped_column(
        ForeignKey("events.id"),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    read_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    user = relationship(
        "User",
        back_populates="notifications",
    )