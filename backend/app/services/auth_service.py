from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, RegisterRequest
from app.services.email_service import EmailService
from app.utils.security import (
    create_access_token,
    generate_email_verification_token,
    hash_email_verification_token,
    hash_password,
    verify_password,
)


class AuthService:

    def __init__(self, db: Session):
        self.db = db
        self.user_repository = UserRepository(db)

    def register(self, data: RegisterRequest):
        existing_user = self.user_repository.get_by_email(data.email)

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email is already registered",
            )

        password_hash = hash_password(data.password)

        verification_token = generate_email_verification_token()
        verification_token_hash = hash_email_verification_token(
            verification_token
        )

        verification_expires_at = (
            datetime.now(timezone.utc)
            + timedelta(
                minutes=settings.email_verification_expire_minutes
            )
        )

        user = self.user_repository.create(
            name=data.name,
            email=data.email,
            password_hash=password_hash,
            email_verification_token_hash=verification_token_hash,
            email_verification_expires_at=verification_expires_at,
        )

        try:
            EmailService.send_verification_email(
                recipient_email=user.email,
                recipient_name=user.name,
                verification_token=verification_token,
            )
        except Exception:
            self.db.rollback()

            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Unable to send verification email. Please try again later.",
            )

        return user

    def verify_email(self, token: str):
        token_hash = hash_email_verification_token(token)

        user = self.user_repository.get_by_verification_token_hash(
            token_hash
        )

        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired verification token",
            )

        if user.email_verified:
            return {
                "message": "Email is already verified",
            }

        if (
            not user.email_verification_expires_at
            or user.email_verification_expires_at
            < datetime.now(timezone.utc)
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired verification token",
            )

        self.user_repository.mark_email_verified(user)

        return {
            "message": "Email verified successfully",
        }

    def login(self, data: LoginRequest):
        user = self.user_repository.get_by_email(data.email)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive",
            )

        if not user.email_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Please verify your email address before logging in",
            )

        if not verify_password(data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        access_token = create_access_token(
            user_id=user.id,
            role=user.role.value,
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
        }