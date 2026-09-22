from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies.auth import require_customer
from app.dependencies.database import get_db
from app.models import User
from app.schemas.ticket import TicketResponse
from app.services.ticket_service import TicketService


router = APIRouter(
    prefix="/tickets",
    tags=["Tickets"],
)


@router.get(
    "/{ticket_id}",
    response_model=TicketResponse,
)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
):
    service = TicketService(db)

    return service.get_customer_ticket(
        ticket_id=ticket_id,
        user_id=current_user.id,
    )


@router.get(
    "/booking/{booking_id}",
    response_model=TicketResponse,
)
def get_ticket_by_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
):
    service = TicketService(db)

    booking = service.booking_repository.get_by_id(
        db,
        booking_id,
    )

    if not booking or booking.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found",
        )

    ticket = service.ticket_repository.get_by_booking_id(
        db,
        booking_id,
    )

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found",
        )

    return service._build_response(ticket)