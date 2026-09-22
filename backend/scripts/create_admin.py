from getpass import getpass

from sqlalchemy import select

from app.database import SessionLocal
from app.models import User, UserRole
from app.utils.security import hash_password


def create_admin():
    name = input("Admin name: ").strip()
    email = input("Admin email: ").strip().lower()
    password = getpass("Admin password: ")
    confirm_password = getpass("Confirm password: ")

    if not name:
        print("Error: Admin name is required.")
        return

    if not email:
        print("Error: Admin email is required.")
        return

    if len(password) < 8:
        print("Error: Password must be at least 8 characters.")
        return

    if password != confirm_password:
        print("Error: Passwords do not match.")
        return

    db = SessionLocal()

    try:
        existing_user = db.scalar(
            select(User).where(User.email == email)
        )

        if existing_user:
            print("Error: A user with this email already exists.")
            return

        admin = User(
            name=name,
            email=email,
            password_hash=hash_password(password),
            role=UserRole.ADMIN,
            is_active=True,
        )

        db.add(admin)
        db.commit()
        db.refresh(admin)

        print()
        print("Admin created successfully.")
        print(f"Admin ID: {admin.id}")
        print(f"Admin email: {admin.email}")
        print(f"Admin role: {admin.role.value}")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    create_admin()