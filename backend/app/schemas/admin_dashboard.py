from pydantic import BaseModel


class AdminDashboardResponse(BaseModel):
    total_customers: int
    total_cities: int
    total_venues: int
    upcoming_events: int
    total_bookings: int
    confirmed_bookings: int
    revenue: int
    available_seats: int
    tickets_scanned: int