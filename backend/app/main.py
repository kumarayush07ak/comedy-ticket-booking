from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers.auth import router as auth_router
from app.routers.cities import router as cities_router
from app.routers.venues import router as venues_router
from app.routers.seats import router as seats_router
from app.routers.events import router as events_router
from app.routers.reservations import router as reservations_router
from app.routers.bookings import router as bookings_router
from app.routers.payments import router as payments_router
from app.routers.tickets import router as tickets_router
from app.routers.scanner import router as scanner_router
from app.routers.cancellations import router as cancellations_router
from app.routers import event_cancellations
from app.routers import notifications
from app.routers import admin_dashboard


app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(cities_router)
app.include_router(venues_router)
app.include_router(seats_router)
app.include_router(events_router)
app.include_router(reservations_router)
app.include_router(bookings_router)
app.include_router(payments_router)
app.include_router(tickets_router)
app.include_router(scanner_router)
app.include_router(cancellations_router)
app.include_router(event_cancellations.router)
app.include_router(notifications.router)
app.include_router(admin_dashboard.router)


@app.get("/")
def root():
    return {
        "message": "Comedy Ticket Booking Platform API",
        "status": "running",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
