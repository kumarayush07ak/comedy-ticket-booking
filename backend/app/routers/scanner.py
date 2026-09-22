from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies.auth import require_admin
from app.dependencies.database import get_db
from app.models import User
from app.schemas.scanner import TicketScanRequest, TicketScanResponse
from app.services.ticket_service import TicketService


router = APIRouter(
    prefix="/scanner",
    tags=["Scanner"],
)


@router.post(
    "/scan",
    response_model=TicketScanResponse,
)
def scan_ticket(
    request: TicketScanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    service = TicketService(db)

    return service.scan_ticket(
        qr_token=request.qr_token,
    )