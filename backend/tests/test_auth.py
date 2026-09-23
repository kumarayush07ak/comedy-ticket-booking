from unittest.mock import patch
import uuid

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_customer_registration_verification_and_login():
    email = f"ci_auth_customer_{uuid.uuid4().hex}@example.com"
    password = "TestPassword123!"
    captured = {}

    def fake_send_verification_email(recipient_email, recipient_name, verification_token):
        captured["token"] = verification_token

    with patch(
        "app.services.auth_service.EmailService.send_verification_email",
        side_effect=fake_send_verification_email,
    ):
        register_response = client.post(
            "/auth/register",
            json={
                "name": "CI Auth Customer",
                "email": email,
                "password": password,
            },
        )

    assert register_response.status_code == 201
    assert register_response.json()["email"] == email
    assert "token" in captured

    login_before_verification = client.post(
        "/auth/login",
        json={"email": email, "password": password},
    )

    assert login_before_verification.status_code == 403
    assert login_before_verification.json()["detail"] == "Please verify your email address before logging in"

    verify_response = client.get(
        "/auth/verify-email",
        params={"token": captured["token"]},
    )

    assert verify_response.status_code == 200
    assert verify_response.json()["message"] == "Email verified successfully"

    login_response = client.post(
        "/auth/login",
        json={"email": email, "password": password},
    )

    assert login_response.status_code == 200
    assert login_response.json()["token_type"] == "bearer"
    assert login_response.json()["access_token"]

    access_token = login_response.json()["access_token"]

    me_response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )

    assert me_response.status_code == 200
    assert me_response.json()["email"] == email
    assert me_response.json()["role"] == "CUSTOMER"


def test_duplicate_customer_registration_is_rejected():
    email = f"ci_duplicate_customer_{uuid.uuid4().hex}@example.com"
    password = "TestPassword123!"

    captured = {}

    def fake_send_verification_email(recipient_email, recipient_name, verification_token):
        captured["token"] = verification_token

    with patch(
        "app.services.auth_service.EmailService.send_verification_email",
        side_effect=fake_send_verification_email,
    ):
        first_response = client.post(
            "/auth/register",
            json={
                "name": "Duplicate Test Customer",
                "email": email,
                "password": password,
            },
        )

    assert first_response.status_code == 201

    duplicate_response = client.post(
        "/auth/register",
        json={
            "name": "Duplicate Test Customer",
            "email": email,
            "password": password,
        },
    )

    assert duplicate_response.status_code == 409
    assert duplicate_response.json()["detail"] == "Email is already registered"
