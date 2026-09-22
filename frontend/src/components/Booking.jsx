import { useEffect, useMemo, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import { createBooking } from "../api/bookings";
import { createPayment } from "../api/payments";

function Booking() {
  const { reservationId } = useParams();

  const location = useLocation();
  const navigate = useNavigate();

  const reservation =
    location.state?.reservation;

  const event =
    location.state?.event;

  const selectedSeats =
    location.state?.selectedSeats || [];

  const [booking, setBooking] =
    useState(null);

  const [payment, setPayment] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [paymentLoading, setPaymentLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const totalAmount = useMemo(() => {
    if (!event) {
      return 0;
    }

    return (
      selectedSeats.length *
      Number(event.ticket_price)
    );
  }, [event, selectedSeats]);

  useEffect(() => {
    const token =
      localStorage.getItem("access_token");

    const role =
      localStorage.getItem("user_role");

    if (!token || role !== "CUSTOMER") {
      navigate("/login");
    }
  }, [navigate]);

  async function handleCreateBooking() {
    if (!event || selectedSeats.length === 0) {
      setError(
        "Booking information is missing."
      );

      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const bookingData =
        await createBooking(
          event.id,
          selectedSeats
        );

      setBooking(bookingData);

      setSuccess(
        "Your seats have been reserved for this booking."
      );
    } catch (err) {
      console.error(err);

      if (err.response?.status === 409) {
        setError(
          err.response?.data?.detail ||
            "The selected seats are no longer available."
        );
      } else if (
        err.response?.status === 401
      ) {
        navigate("/login");
      } else {
        setError(
          err.response?.data?.detail ||
            "Unable to create the booking."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function handlePayment() {
    if (!booking) {
      setError(
        "Please create the booking first."
      );

      return;
    }

    try {
      setPaymentLoading(true);
      setError("");
      setSuccess("");

      const paymentData =
        await createPayment(
          booking.id
        );

      setPayment(paymentData);

      setSuccess(
        "Payment successful! Your booking is confirmed."
      );

      /*
       * Payment is successful.
       *
       * The backend automatically generates
       * the ticket for this confirmed booking.
       *
       * We use booking_id here because our
       * ticket endpoint retrieves the ticket
       * using the booking ID.
       */
      navigate(
        `/ticket/${paymentData.booking_id}`
      );
    } catch (err) {
      console.error(err);

      if (err.response?.status === 409) {
        setError(
          err.response?.data?.detail ||
            "This booking cannot be paid."
        );
      } else if (
        err.response?.status === 401
      ) {
        navigate("/login");
      } else {
        setError(
          err.response?.data?.detail ||
            "Payment failed. Please try again."
        );
      }
    } finally {
      setPaymentLoading(false);
    }
  }

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

    return date.toLocaleTimeString(
      "en-IN",
      {
        hour: "numeric",
        minute: "2-digit",
      }
    );
  }

  if (!reservation || !event) {
    return (
      <main className="booking-page">
        <div className="booking-error-state">
          <div>🎟️</div>

          <h2>
            Booking session not found
          </h2>

          <p>
            Your seat selection information
            is no longer available.
          </p>

          <button
            className="primary-button"
            onClick={() =>
              navigate("/events")
            }
          >
            Browse Events
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="booking-page">

      <button
        className="event-back-button"
        onClick={() =>
          navigate(
            `/events/${event.id}`
          )
        }
        disabled={Boolean(booking)}
      >
        ← Back to Event
      </button>

      <div className="booking-header">

        <span className="section-eyebrow">
          CHECKOUT
        </span>

        <h1>
          Complete Your Booking
        </h1>

        <p>
          Review your seats and complete
          the simulated payment.
        </p>

      </div>

      {error && (
        <div className="booking-alert booking-alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="booking-alert booking-alert-success">
          {success}
        </div>
      )}

      <section className="booking-layout">

        {/* Event summary */}

        <div className="booking-card">

          <div className="booking-card-heading">
            <span>
              🎭
            </span>

            <div>
              <small>
                EVENT
              </small>

              <h2>
                {event.title}
              </h2>
            </div>
          </div>

          <div className="booking-event-details">

            <div>
              <span>📅</span>

              <div>
                <small>Date</small>

                <strong>
                  {formatDate(
                    event.event_date
                  )}
                </strong>
              </div>
            </div>

            <div>
              <span>🕐</span>

              <div>
                <small>Time</small>

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

          </div>

          <div className="booking-location">
            <span>📍</span>

            <div>
              <small>
                Venue
              </small>

              <strong>
                Venue #{event.venue_id}
              </strong>
            </div>
          </div>

        </div>

        {/* Selected seats */}

        <div className="booking-card">

          <div className="booking-card-heading">
            <span>
              💺
            </span>

            <div>
              <small>
                YOUR SELECTION
              </small>

              <h2>
                Selected Seats
              </h2>
            </div>
          </div>

          <div className="booking-seat-list">

            {selectedSeats.map(
              (seatId, index) => (
                <div
                  className="booking-seat-item"
                  key={seatId}
                >

                  <span>
                    {index + 1}
                  </span>

                  <div>
                    <small>
                      Seat
                    </small>

                    <strong>
                      #{seatId}
                    </strong>
                  </div>

                  <strong>
                    ₹
                    {Number(
                      event.ticket_price
                    ).toFixed(0)}
                  </strong>

                </div>
              )
            )}

          </div>

          <div className="booking-total">

            <div>
              <small>
                {selectedSeats.length} seat
                {selectedSeats.length !== 1
                  ? "s"
                  : ""}
              </small>

              <span>
                Total
              </span>
            </div>

            <strong>
              ₹
              {totalAmount.toFixed(0)}
            </strong>

          </div>

        </div>

      </section>

      {/* Reservation */}

      {!booking && (
        <section className="booking-action-card">

          <div>
            <span className="booking-step">
              01
            </span>

            <div>
              <h3>
                Create Booking
              </h3>

              <p>
                Confirm your selected seats
                and create your booking.
              </p>
            </div>
          </div>

          <button
            className="primary-button"
            onClick={
              handleCreateBooking
            }
            disabled={loading}
          >
            {loading
              ? "Creating Booking..."
              : "Create Booking"}
          </button>

        </section>
      )}

      {/* Payment */}

      {booking && !payment && (
        <section className="booking-action-card payment-card">

          <div>
            <span className="booking-step">
              02
            </span>

            <div>
              <h3>
                Complete Payment
              </h3>

              <p>
                This project uses a simulated
                payment gateway.
              </p>
            </div>
          </div>

          <div className="payment-summary">

            <small>
              Amount
            </small>

            <strong>
              ₹
              {Number(
                booking.total_amount
              ).toFixed(0)}
            </strong>

          </div>

          <button
            className="primary-button"
            onClick={
              handlePayment
            }
            disabled={paymentLoading}
          >
            {paymentLoading
              ? "Processing..."
              : "Pay Now"}
          </button>

        </section>
      )}

      {/* Payment success */}

      {payment && (
        <section className="booking-confirmed-card">

          <div className="booking-success-icon">
            ✓
          </div>

          <span className="section-eyebrow">
            BOOKING CONFIRMED
          </span>

          <h2>
            You're all set! 🎉
          </h2>

          <p>
            Your booking has been confirmed
            and your payment was successful.
          </p>

          <div className="confirmation-details">

            <div>
              <small>
                Booking ID
              </small>

              <strong>
                #{booking.id}
              </strong>
            </div>

            <div>
              <small>
                Payment
              </small>

              <strong>
                {payment.status}
              </strong>
            </div>

            <div>
              <small>
                Transaction
              </small>

              <strong>
                {payment.transaction_id ||
                  "Completed"}
              </strong>
            </div>

          </div>

          <button
            className="primary-button"
            onClick={() =>
              navigate(
                `/ticket/${payment.booking_id}`
              )
            }
          >
            View Your Ticket 🎟️
          </button>

        </section>
      )}

      {/* Reservation information */}

      {!payment && (
        <div className="reservation-notice">
          <span>⏱️</span>

          <p>
            Your selected seats are temporarily
            reserved. Complete your booking
            before the reservation expires.
          </p>
        </div>
      )}

    </main>
  );
}

export default Booking;