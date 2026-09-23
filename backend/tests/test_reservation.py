from datetime import date, time
from unittest.mock import patch
import uuid

from fastapi.testclient import TestClient

from app.database import SessionLocal
from app.main import app
from app.models import City, Event, EventFormat, EventSeat, EventStatus, Seat, SeatStatus, User, Venue


client = TestClient(app)


def create_test_event() -> tuple[int, int]:
    db = SessionLocal()

    try:
        city = City(name=f"CI City {uuid.uuid4().hex[:8]}")
        db.add(city)
        db.flush()

        venue = Venue(
            name=f"CI Venue {uuid.uuid4().hex[:8]}",
            city_id=city.id,
            address="CI Test Address",
            description="CI reservation test venue",
        )
        db.add(venue)
        db.flush()

        seat = Seat(
            venue_id=venue.id,
            row_label="A",
            seat_number=1,
            seat_label="A1",
        )
        db.add(seat)
        db.flush()

        event = Event(
            title=f"CI Reservation Event {uuid.uuid4().hex[:8]}",
            description="CI reservation test event",
            event_format=EventFormat.COMEDY_SHOW,
            venue_id=venue.id,
            event_date=date(2030, 1, 1),
            start_time=time(19, 0),
            end_time=time(21, 0),
            ticket_price=500,
            organizer_name="CI Organizer",
            organizer_email="ci-organizer@example.com",
            organizer_phone="9999999999",
            status=EventStatus.UPCOMING,
        )
        db.add(event)
        db.flush()

        event_seat = EventSeat(
            event_id=event.id,
            seat_id=seat.id,
            status=SeatStatus.AVAILABLE,
        )
        db.add(event_seat)
        db.commit()

        return event.id, seat.id
    finally:
        db.close()


def create_verified_customer() -> tuple[str, str]:
    email = f"ci_reservation_{uuid.uuid4().hex}@example.com"
    password = "TestPassword123!"
    captured = {}

    def fake_send_verification_email(recipient_email, recipient_name, verification_token):
        captured["token"] = verification_token

    with patch(
        "app.services.auth_service.EmailService.send_verification_email",
        side_effect=fake_send_verification_email,
    ):
        response = client.post(
            "/auth/register",
            json={
                "name": "CI Reservation Customer",
                "email": email,
                "password": password,
            },
        )

    assert response.status_code == 201

    verify_response = client.get(
        "/auth/verify-email",
        params={"token": captured["token"]},
    )

    assert verify_response.status_code == 200

    login_response = client.post(
        "/auth/login",
        json={"email": email, "password": password},
    )

    assert login_response.status_code == 200

    return email, login_response.json()["access_token"]


def test_customer_can_hold_available_seat_and_second_hold_is_rejected():
    event_id, seat_id = create_test_event()
    _, token = create_verified_customer()

    headers = {"Authorization": f"Bearer {token}"}

    first_response = client.post(
        "/reservations/hold",
        json={
            "event_id": event_id,
            "seat_ids": [seat_id],
        },
        headers=headers,
    )

    assert first_response.status_code == 201
    first_body = first_response.json()
    assert first_body["event_id"] == event_id
    assert first_body["seat_ids"] == [seat_id]
    assert first_body["reservation_id"]
    assert first_body["hold_minutes"] > 0

    second_response = client.post(
        "/reservations/hold",
        json={
            "event_id": event_id,
            "seat_ids": [seat_id],
        },
        headers=headers,
    )

    assert second_response.status_code == 409
