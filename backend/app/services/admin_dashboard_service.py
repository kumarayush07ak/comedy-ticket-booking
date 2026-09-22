from sqlalchemy.orm import Session

from app.repositories.admin_dashboard_repository import (
    AdminDashboardRepository,
)
from app.schemas.admin_dashboard import AdminDashboardResponse


class AdminDashboardService:
    def __init__(
        self,
        repository: AdminDashboardRepository | None = None,
    ):
        self.repository = repository or AdminDashboardRepository()

    def get_dashboard(self, db: Session) -> AdminDashboardResponse:
        return AdminDashboardResponse(
            total_customers=self.repository.count_customers(db),
            total_cities=self.repository.count_cities(db),
            total_venues=self.repository.count_venues(db),
            upcoming_events=self.repository.count_upcoming_events(db),
            total_bookings=self.repository.count_bookings(db),
            confirmed_bookings=self.repository.count_confirmed_bookings(db),
            revenue=self.repository.calculate_revenue(db),
            available_seats=self.repository.count_available_seats(db),
            tickets_scanned=self.repository.count_scanned_tickets(db),
        )