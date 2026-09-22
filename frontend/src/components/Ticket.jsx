import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { getTicketByBooking } from "../api/tickets";

function Ticket() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTicket() {
      try {
        setLoading(true);
        setError("");

        const data = await getTicketByBooking(bookingId);
        setTicket(data);
      } catch (err) {
        console.error(err);

        setError(
          err.response?.data?.detail ||
            "Unable to load your ticket."
        );
      } finally {
        setLoading(false);
      }
    }

    if (bookingId) {
      loadTicket();
    }
  }, [bookingId]);

  if (loading) {
    return (
      <div className="ticket-page">
        <div className="ticket-state">
          <div className="ticket-spinner"></div>
          <h2>Loading your ticket...</h2>
          <p>Please wait while we retrieve your ticket.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ticket-page">
        <div className="ticket-state error">
          <h2>Ticket unavailable</h2>
          <p>{error}</p>

          <button
            className="ticket-button"
            onClick={() => navigate("/customer/dashboard")}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return null;
  }

  return (
    <div className="ticket-page">
      <div className="ticket-wrapper">

        <div className="ticket-header">
          <div>
            <span className="ticket-eyebrow">
              YOUR EVENT TICKET
            </span>

            <h1>Your Ticket 🎟️</h1>

            <p>
              Booking #{ticket.booking_id}
            </p>
          </div>

          <span
            className={`ticket-status ${ticket.status.toLowerCase()}`}
          >
            {ticket.status}
          </span>
        </div>

        <div className="ticket-card">

          <div className="ticket-main">

            <div className="ticket-info">
              <span>Ticket Number</span>
              <strong>{ticket.ticket_number}</strong>
            </div>

            <div className="ticket-info">
              <span>Booking ID</span>
              <strong>#{ticket.booking_id}</strong>
            </div>

            <div className="ticket-info">
              <span>Generated</span>
              <strong>
                {new Date(ticket.generated_at).toLocaleString()}
              </strong>
            </div>

            <div className="ticket-divider"></div>

            <div className="ticket-instruction">
              <h3>Show this QR code at the entrance</h3>

              <p>
                Keep this ticket ready when you arrive at
                the event. An admin will scan your QR code.
              </p>
            </div>

          </div>

          <div className="ticket-qr-section">

            <div className="qr-box">
              <QRCodeSVG
                value={ticket.qr_token}
                size={190}
                level="H"
              />
            </div>

            <p className="qr-label">
              Scan to verify ticket
            </p>

          </div>

        </div>

        <div className="ticket-actions">

          <button
            className="ticket-button secondary"
            onClick={() => navigate("/events")}
          >
            Browse More Events
          </button>

          <button
            className="ticket-button"
            onClick={() => navigate("/customer/dashboard")}
          >
            Go to Dashboard
          </button>

        </div>

        <div className="ticket-security">
          <strong>🔐 Keep your ticket private</strong>
          <p>
            Your QR code is unique to this ticket. Do not
            share it publicly.
          </p>
        </div>

      </div>
    </div>
  );
}

export default Ticket;