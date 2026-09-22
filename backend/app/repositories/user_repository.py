from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import User


class UserRepository:

    def __init__(self, db: Session):
        self.db = db

    def get_by_email(self, email: str) -> User | None:
        statement = select(User).where(User.email == email)
        return self.db.scalar(statement)

    def get_by_id(self, user_id: int) -> User | None:
        statement = select(User).where(User.id == user_id)
        return self.db.scalar(statement)

    def get_by_verification_token_hash(
        self,
        token_hash: str,
    ) -> User | None:
        statement = select(User).where(
            User.email_verification_token_hash == token_hash
        )
        return self.db.scalar(statement)

    def create(
        self,
        name: str,
        email: str,
        password_hash: str,
        email_verification_token_hash: str | None = None,
        email_verification_expires_at: datetime | None = None,
    ) -> User:
        user = User(
            name=name,
            email=email,
            password_hash=password_hash,
            email_verification_token_hash=email_verification_token_hash,
            email_verification_expires_at=email_verification_expires_at,
        )

        self.db.add(user)
        self.db.flush()
        self.db.refresh(user)

        return user

    def mark_email_verified(self, user: User) -> User:
        user.email_verified = True
        user.email_verification_token_hash = None
        user.email_verification_expires_at = None

        self.db.flush()
        self.db.refresh(user)

        return user