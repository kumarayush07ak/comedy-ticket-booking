from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session

from app.dependencies.database import get_db
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.services.auth_service import AuthService
from app.dependencies.auth import get_current_user, require_admin
from app.models import User


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    data: RegisterRequest,
    db: Session = Depends(get_db),
):
    service = AuthService(db)
    return service.register(data)


@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    data: LoginRequest,
    db: Session = Depends(get_db),
):
    service = AuthService(db)
    return service.login(data)

@router.get(
    "/me",
    response_model=UserResponse,
)
def get_me(
    current_user:User = Depends(get_current_user),

):
    return current_user

@router.get("/verify-email")
def verify_email(
    token: str = Query(min_length=1),
    db: Session = Depends(get_db),
):
    service = AuthService(db)
    return service.verify_email(token)

@router.get("/admin-test")
def admin_test(
    current_user: User = Depends(require_admin),
):
    return {
        "message": "Admin access granted",
        "user_id": current_user.id,
        "role": current_user.role.value,
    }