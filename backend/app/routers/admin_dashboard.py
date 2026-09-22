from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies.auth import require_admin
from app.dependencies.database import get_db
from app.models import User
from app.schemas.admin_dashboard import AdminDashboardResponse
from app.services.admin_dashboard_service import AdminDashboardService


router = APIRouter(
    prefix="/admin",
    tags=["Admin Dashboard"],
)

service = AdminDashboardService()


@router.get(
    "/dashboard",
    response_model=AdminDashboardResponse,
)
def get_admin_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return service.get_dashboard(db)