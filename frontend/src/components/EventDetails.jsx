import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { holdSeats } from "../api/reservations";

import {
  getEvent,
  getEventSeats,
} from "../api/events";

import { getVenues } from "../api/venues";
import { getCities } from "../api/cities";

function EventDetails() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [seatLayout, setSeatLayout] = useState(null);
  const [venues, setVenues] = useState([]);
  const [cities, setCities] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // IMPORTANT:
  // selectedSeats contains physical seat_id values.
  // The backend reservation API expects seat_ids.
  const [selectedSeats, setSelectedSeats] = useState([]);

  const [holdingSeats, setHoldingSeats] = useState(false);
  const [holdError, setHoldError] = useState("");

  useEffect(() => {
    loadEventDetails();
  }, [eventId]);

  async function loadEventDetails() {
    try {
      setLoading(true);
      setError("");
      setHoldError("");

      const [
        eventData,
        seatData,
        venueData,
        cityData,
      ] = await Promise.all([
        getEvent(eventId),
        getEventSeats(eventId),
        getVenues(),
        getCities(),
      ]);

      setEvent(eventData);
      setSeatLayout(seatData);
      setVenues(venueData);
      setCities(cityData);
    } catch (err) {
      console.error(err);

      if (err.response?.status === 404) {
        setError("Event not found.");
      } else {
        setError(
          err.response?.data?.detail ||
            "Failed to load event details."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  const venue = useMemo(() => {
    if (!event) {
      return null;
    }

    return venues.find(
      (item) => item.id === event.venue_id
    );
  }, [event, venues]);

  const city = useMemo(() => {
    if (!venue) {
      return null;
    }

    return cities.find(
      (item) => item.id === venue.city_id
    );
  }, [venue, cities]);

  const seatStats = useMemo(() => {
    if (!seatLayout?.rows) {
      return {
        total: 0,
        available: 0,
        held: 0,
        booked: 0,
      };
    }

    const seats = Object.values(
      seatLayout.rows
    ).flat();

    return {
      total: seats.length,

      available: seats.filter(
        (seat) => seat.status === "AVAILABLE"
      ).length,

      held: seats.filter(
        (seat) => seat.status === "HELD"
      ).length,

      booked: seats.filter(
        (seat) => seat.status === "BOOKED"
      ).length,
    };
  }, [seatLayout]);

  function formatDate(dateString) {
    if (!dateString) {
      return "";
    }

    return new Date(
      `${dateString}T00:00:00`
    ).toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function formatTime(timeString) {
    if (!timeString) {
      return "";
    }

    const [hour, minute] =
      timeString.split(":");

    const date = new Date();

    date.setHours(
      Number(hour),
      Number(minute),
      0,
      0
    );

    return date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function formatEventFormat(format) {
    if (!format) {
      return "";
    }

    return format
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  }

  function getSeatClass(status) {
    if (status === "AVAILABLE") {
      return "event-seat available";
    }

    if (status === "HELD") {
      return "event-seat held";
    }

    if (status === "BOOKED") {
      return "event-seat booked";
    }

    return "event-seat";
  }

  /*
   * IMPORTANT ID FIX
   *
   * event_seat_id = event-specific mapping ID
   * seat_id       = physical seat ID
   *
   * ReservationService expects physical seat_id values.
   *
   * Therefore selectedSeats stores:
   *
   * [12, 13, 14]
   *
   * NOT:
   *
   * [37, 38, 39]
   *
   * when those numbers are event_seat_id values.
   */
  function toggleSeat(seat) {
    if (seat.status !== "AVAILABLE") {
      return;
    }

    setHoldError("");

    setSelectedSeats((current) => {
      const seatId = seat.seat_id;

      const alreadySelected =
        current.includes(seatId);

      if (alreadySelected) {
        return current.filter(
          (id) => id !== seatId
        );
      }

      if (current.length >= 10) {
        setHoldError(
          "You can select a maximum of 10 seats."
        );

        return current;
      }

      return [
        ...current,
        seatId,
      ];
    });
  }

  async function handleHoldSeats() {
    if (!event) {
      return;
    }

    if (selectedSeats.length === 0) {
      setHoldError(
        "Please select at least one seat."
      );

      return;
    }

    try {
      setHoldingSeats(true);
      setHoldError("");

      /*
       * selectedSeats contains physical seat_id values.
       *
       * Backend expects:
       *
       * {
       *   event_id: event.id,
       *   seat_ids: [physical seat IDs]
       * }
       */
      const reservation =
        await holdSeats(
          event.id,
          selectedSeats
        );

      navigate(
        `/booking/${reservation.reservation_id}`,
        {
          state: {
            reservation,
            event,
            selectedSeats,
          },
        }
      );
    } catch (err) {
      console.error(err);

      if (err.response?.status === 409) {
        setHoldError(
          err.response?.data?.detail ||
            "One or more selected seats are no longer available."
        );
      } else if (
        err.response?.status === 401
      ) {
        navigate("/login");
        return;
      } else {
        setHoldError(
          err.response?.data?.detail ||
            "Unable to hold the selected seats."
        );
      }

      await loadEventDetails();

      setSelectedSeats([]);
    } finally {
      setHoldingSeats(false);
    }
  }

  function scrollToSeatMap() {
    document
      .querySelector(
        ".seat-availability-section"
      )
      ?.scrollIntoView({
        behavior: "smooth",
      });
  }

  if (loading) {
    return (
      <main className="event-details-page">
        <div className="event-details-loading">
          <div>🎭</div>

          <h2>
            Loading event...
          </h2>

          <p>
            Getting the details and seat
            availability.
          </p>
        </div>
      </main>
    );
  }

  if (error || !event) {
    return (
      <main className="event-details-page">
        <div className="event-details-error">
          <div>😕</div>

          <h2>
            {error || "Event not found"}
          </h2>

          <p>
            We couldn't load this event.
          </p>

          <button
            className="primary-button"
            onClick={() =>
              navigate("/events")
            }
          >
            ← Back to Events
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="event-details-page">

      {/* =========================
          BACK
      ========================= */}

      <button
        className="event-back-button"
        onClick={() =>
          navigate("/events")
        }
      >
        ← Back to Events
      </button>


      {/* =========================
          EVENT HERO
      ========================= */}

      <section className="event-detail-hero">

        {/* Poster */}

        <div className="event-detail-poster">
          {event.poster_url ? (
            <img
              src={event.poster_url}
              alt={event.title}
            />
          ) : (
            <div className="event-detail-poster-placeholder">
              <span>🎭</span>

              <small>
                LaughTicket
              </small>
            </div>
          )}
        </div>


        {/* Event Information */}

        <div className="event-detail-main">

          <span className="customer-event-format">
            {formatEventFormat(
              event.event_format
            )}
          </span>

          <div className="event-detail-status-row">
            <span
              className={`customer-event-status ${event.status.toLowerCase()}`}
            >
              {event.status}
            </span>
          </div>

          <h1>
            {event.title}
          </h1>

          {event.description && (
            <p className="event-detail-description">
              {event.description}
            </p>
          )}

          <div className="event-detail-meta">

            {/* Date */}

            <div className="event-meta-item">
              <span>📅</span>

              <div>
                <small>
                  Date
                </small>

                <strong>
                  {formatDate(
                    event.event_date
                  )}
                </strong>
              </div>
            </div>


            {/* Time */}

            <div className="event-meta-item">
              <span>🕐</span>

              <div>
                <small>
                  Time
                </small>

                <strong>
                  {formatTime(
                    event.start_time
                  )}
                  {" – "}
                  {formatTime(
                    event.end_time
                  )}
                </strong>
              </div>
            </div>


            {/* Venue */}

            <div className="event-meta-item">
              <span>📍</span>

              <div>
                <small>
                  Venue
                </small>

                <strong>
                  {venue?.name ||
                    "Venue"}
                </strong>

                <small>
                  {city?.name ||
                    "City"}
                </small>
              </div>
            </div>

          </div>


          {/* Organizer */}

          <div className="event-organizer">
            <small>
              Presented by
            </small>

            <strong>
              {event.organizer_name}
            </strong>
          </div>

        </div>


        {/* Price */}

        <div className="event-detail-price">

          <small>
            Ticket Price
          </small>

          <strong>
            ₹
            {Number(
              event.ticket_price
            ).toFixed(0)}
          </strong>

          <span>
            per ticket
          </span>

          <button
            className="primary-button"
            onClick={scrollToSeatMap}
            disabled={
              event.status !==
              "UPCOMING"
            }
          >
            {event.status ===
            "UPCOMING"
              ? "Select Seats"
              : "Booking Unavailable"}
          </button>

        </div>

      </section>


      {/* =========================
          SEAT AVAILABILITY
      ========================= */}

      <section className="seat-availability-section">

        {/* Header */}

        <div className="seat-availability-header">

          <div>
            <span className="section-eyebrow">
              SEAT MAP
            </span>

            <h2>
              Seat Availability
            </h2>

            <p>
              Select your seats before
              continuing to booking.
            </p>
          </div>

          <div className="seat-total">
            <strong>
              {seatStats.total}
            </strong>

            <span>
              Total Seats
            </span>
          </div>

        </div>


        {/* =========================
            STATISTICS
        ========================= */}

        <div className="seat-stat-grid">

          <div className="seat-stat available-stat">
            <span className="seat-stat-dot" />

            <div>
              <strong>
                {seatStats.available}
              </strong>

              <small>
                Available
              </small>
            </div>
          </div>


          <div className="seat-stat held-stat">
            <span className="seat-stat-dot" />

            <div>
              <strong>
                {seatStats.held}
              </strong>

              <small>
                Temporarily Held
              </small>
            </div>
          </div>


          <div className="seat-stat booked-stat">
            <span className="seat-stat-dot" />

            <div>
              <strong>
                {seatStats.booked}
              </strong>

              <small>
                Booked
              </small>
            </div>
          </div>

        </div>


        {/* =========================
            LEGEND
        ========================= */}

        <div className="seat-legend">

          <div>
            <span className="legend-seat available" />
            Available
          </div>

          <div>
            <span className="legend-seat held" />
            Held
          </div>

          <div>
            <span className="legend-seat booked" />
            Booked
          </div>

        </div>


        {/* =========================
            SEAT MAP
        ========================= */}

        <div className="seat-map-container">

          <div className="seat-stage">
            STAGE
          </div>

          <div className="event-seat-map">

            {Object.entries(
              seatLayout?.rows || {}
            ).map(
              ([rowLabel, seats]) => (
                <div
                  className="event-seat-row"
                  key={rowLabel}
                >

                  <div className="event-seat-row-label">
                    {rowLabel}
                  </div>

                  <div className="event-seat-list">

                    {seats.map(
                      (seat) => {

                        /*
                         * IMPORTANT:
                         *
                         * React key uses event_seat_id.
                         *
                         * Selection uses seat_id.
                         *
                         * This keeps the UI identity and
                         * backend reservation identity
                         * separate.
                         */

                        const isSelected =
                          selectedSeats.includes(
                            seat.seat_id
                          );

                        return (
                          <button
                            key={
                              seat.event_seat_id
                            }
                            type="button"
                            className={`${getSeatClass(
                              seat.status
                            )} ${
                              isSelected
                                ? "selected"
                                : ""
                            }`}
                            disabled={
                              seat.status !==
                              "AVAILABLE"
                            }
                            onClick={() =>
                              toggleSeat(
                                seat
                              )
                            }
                            title={`${seat.seat_label} — ${seat.status}`}
                          >
                            {seat.seat_number}
                          </button>
                        );
                      }
                    )}

                  </div>

                </div>
              )
            )}

          </div>

        </div>


        {/* =========================
            HOLD ERROR
        ========================= */}

        {holdError && (
          <div className="seat-hold-error">
            {holdError}
          </div>
        )}


        {/* =========================
            SELECTION SUMMARY
        ========================= */}

        <div className="seat-selection-footer">

          <div>
            <small>
              Selected Seats
            </small>

            <strong>
              {selectedSeats.length}
            </strong>

            {selectedSeats.length > 0 && (
              <span>
                {" "}
                × ₹
                {Number(
                  event.ticket_price
                ).toFixed(0)}
              </span>
            )}
          </div>


          <div className="seat-selection-total">

            <small>
              Total
            </small>

            <strong>
              ₹
              {(
                selectedSeats.length *
                Number(
                  event.ticket_price
                )
              ).toFixed(0)}
            </strong>

          </div>


          <button
            className="primary-button"
            disabled={
              selectedSeats.length === 0 ||
              holdingSeats ||
              event.status !== "UPCOMING"
            }
            onClick={
              handleHoldSeats
            }
          >
            {holdingSeats
              ? "Holding Seats..."
              : selectedSeats.length ===
                0
              ? "Select Seats"
              : `Hold ${
                  selectedSeats.length
                } Seat${
                  selectedSeats.length > 1
                    ? "s"
                    : ""
                }`}
          </button>

        </div>

      </section>

    </main>
  );
}

export default EventDetails;