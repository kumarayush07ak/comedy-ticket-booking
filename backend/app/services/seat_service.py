from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Event, Seat, Venue
from app.repositories.seat_repository import SeatRepository
from app.schemas.seat import (
    SeatLayoutCreateRequest,
    SeatLayoutResponse,
    SeatResponse,
)


class SeatService:

    def __init__(self, db: Session):
        self.db = db
        self.repository = SeatRepository()

    def _get_venue(self, venue_id: int) -> Venue:
        venue = self.db.get(Venue, venue_id)

        if venue is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Venue not found",
            )

        return venue

    def _validate_rows(self, request: SeatLayoutCreateRequest):
        normalized_rows = []
        seen_rows = set()

        for row in request.rows:
            row_label = row.row_label.strip().upper()

            if not row_label:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Row label cannot be empty",
                )

            if row_label in seen_rows:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Duplicate row label: {row_label}",
                )

            seen_rows.add(row_label)

            normalized_rows.append(
                {
                    "row_label": row_label,
                    "seat_count": row.seat_count,
                }
            )

        return normalized_rows

    def create_or_replace_layout(
        self,
        venue_id: int,
        request: SeatLayoutCreateRequest,
    ) -> SeatLayoutResponse:

        venue = self._get_venue(venue_id)

        # Physical layout must not be changed once events depend on it.
        existing_event = (
            self.db.query(Event.id)
            .filter(Event.venue_id == venue_id)
            .first()
        )

        if existing_event is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Seat layout cannot be changed because this venue has events",
            )

        normalized_rows = self._validate_rows(request)

        # Validate the complete request before changing the database.
        total_seats = sum(row["seat_count"] for row in normalized_rows)

        if total_seats <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Seat layout must contain at least one seat",
            )

        # Remove the old physical layout.
        self.repository.delete_by_venue_id(
            self.db,
            venue_id,
        )

        # Generate seats from the row definitions.
        for row in normalized_rows:
            row_label = row["row_label"]
            seat_count = row["seat_count"]

            for seat_number in range(1, seat_count + 1):
                seat_label = f"{row_label}{seat_number}"

                self.repository.create(
                    self.db,
                    venue_id=venue_id,
                    row_label=row_label,
                    seat_number=seat_number,
                    seat_label=seat_label,
                )

        return self.get_layout(venue_id)

    def get_layout(self, venue_id: int) -> SeatLayoutResponse:
        self._get_venue(venue_id)

        seats = self.repository.get_by_venue_id(
            self.db,
            venue_id,
        )

        rows: dict[str, list[SeatResponse]] = {}

        for seat in seats:
            if seat.row_label not in rows:
                rows[seat.row_label] = []

            rows[seat.row_label].append(
                SeatResponse(
                    id=seat.id,
                    venue_id=seat.venue_id,
                    row_label=seat.row_label,
                    seat_number=seat.seat_number,
                    seat_label=seat.seat_label,
                )
            )

        return SeatLayoutResponse(
            venue_id=venue_id,
            total_seats=len(seats),
            rows=rows,
        )