import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getMyBookings,
  cancelBooking,
} from "../api/bookings";

function CustomerDashboard() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    try {
      setLoading(true);
      setError("");

      const data = await getMyBookings();
      setBookings(data);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Unable to load your bookings."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelBooking(bookingId) {
    const confirmed = window.confirm(
      `Are you sure you want to cancel Booking #${bookingId}?\n\n` +
        "Your payment will be refunded according to the cancellation policy."
    );

    if (!confirmed) {
      return;
    }

    try {
      setCancellingId(bookingId);
      setError("");
      setSuccessMessage("");

      await cancelBooking(bookingId);

      setSuccessMessage(
        `Booking #${bookingId} cancelled successfully. Your payment has been refunded.`
      );

      await loadBookings();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Unable to cancel this booking."
      );
    } finally {
      setCancellingId(null);
    }
  }

  function formatDate(dateString) {
    if (!dateString) return "N/A";

    return new Date(dateString).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }

  function getStatusClass(status) {
    switch (status) {
      case "CONFIRMED":
        return "status-confirmed";

      case "CANCELLED":
        return "status-cancelled";

      case "PENDING":
        return "status-pending";

      case "EXPIRED":
        return "status-cancelled";

      default:
        return "";
    }
  }

  return (
    <main className="customer-dashboard">
      <section className="dashboard-hero">
        <div>
          <p className="dashboard-label">
            YOUR DASHBOARD
          </p>

          <h1>
            Your comedy
            <br />
            <span>journey continues.</span>
          </h1>

          <p className="dashboard-subtitle">
            Manage your bookings, tickets and upcoming
            comedy shows.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => navigate("/events")}
        >
          Browse Events
        </button>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <p className="dashboard-label">
              BOOKINGS
            </p>

            <h2>My Bookings</h2>
          </div>

          <span className="booking-count">
            {bookings.length} booking
            {bookings.length !== 1 ? "s" : ""}
          </span>
        </div>

        {successMessage && (
          <div className="dashboard-state dashboard-success">
            <p>{successMessage}</p>
          </div>
        )}

        {loading && (
          <div className="dashboard-state">
            <p>Loading your bookings...</p>
          </div>
        )}

        {!loading && error && (
          <div className="dashboard-state dashboard-error">
            <p>{error}</p>

            <button
              className="secondary-button"
              onClick={loadBookings}
            >
              Try Again
            </button>
          </div>
        )}

        {!loading &&
          !error &&
          bookings.length === 0 && (
            <div className="dashboard-empty">
              <div className="empty-icon">
                🎟️
              </div>

              <h3>No bookings yet</h3>

              <p>
                Your next comedy adventure is
                waiting for you.
              </p>

              <button
                className="primary-button"
                onClick={() =>
                  navigate("/events")
                }
              >
                Explore Events
              </button>
            </div>
          )}

        {!loading &&
          bookings.length > 0 && (
            <div className="booking-list">
              {bookings.map((booking) => (
                <article
                  className="booking-card"
                  key={booking.id}
                >
                  <div className="booking-main">
                    <div className="booking-title-row">
                      <div>
                        <p className="booking-label">
                          BOOKING #{booking.id}
                        </p>

                        <h3>
                          {booking.event_title}
                        </h3>
                      </div>

                      <span
                        className={`booking-status ${getStatusClass(
                          booking.status
                        )}`}
                      >
                        {booking.status}
                      </span>
                    </div>

                    <div className="booking-details">
                      <div>
                        <span>Booked On</span>

                        <strong>
                          {formatDate(
                            booking.created_at
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>Seats</span>

                        <strong>
                          {booking.items?.length ||
                            0}
                        </strong>
                      </div>

                      <div>
                        <span>Total</span>

                        <strong>
                          ₹
                          {Number(
                            booking.total_amount
                          ).toFixed(2)}
                        </strong>
                      </div>
                    </div>

                    {booking.items?.length > 0 && (
                      <div className="booking-seats">
                        <span>Seats</span>

                        <div className="seat-chip-list">
                          {booking.items.map(
                            (item) => (
                              <span
                                className="seat-chip"
                                key={item.seat_id}
                              >
                                {item.seat_label}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="booking-actions">
                    {booking.status ===
                      "CONFIRMED" && (
                      <>
                        <button
                          className="primary-button"
                          onClick={() =>
                            navigate(
                              `/ticket/${booking.id}`
                            )
                          }
                        >
                          View Ticket 🎟️
                        </button>

                        <button
                          className="secondary-button"
                          disabled={
                            cancellingId ===
                            booking.id
                          }
                          onClick={() =>
                            handleCancelBooking(
                              booking.id
                            )
                          }
                        >
                          {cancellingId ===
                          booking.id
                            ? "Cancelling..."
                            : "Cancel Booking"}
                        </button>
                      </>
                    )}

                    {booking.status !==
                      "CONFIRMED" && (
                      <span className="booking-action-note">
                        Ticket unavailable
                      </span>
                    )}

                    <button
                      className="secondary-button"
                      onClick={() =>
                        navigate(
                          `/events/${booking.event_id}`
                        )
                      }
                    >
                      View Event
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
      </section>
    </main>
  );
}

export default CustomerDashboard;