import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyBookings } from "../api/bookings";
import { getEvents } from "../api/events";
import { getNotifications } from "../api/notifications";

function CustomerHome() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [events, setEvents] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadHomeData();
  }, []);

  async function loadHomeData() {
    try {
      setLoading(true);
      setError("");

      const [bookingData, eventData, notificationData] =
        await Promise.all([
          getMyBookings(),
          getEvents(),
          getNotifications(),
        ]);

      setBookings(bookingData || []);
      setEvents(eventData || []);
      setNotifications(notificationData || []);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Unable to load your home page."
      );
    } finally {
      setLoading(false);
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

  function formatTime(timeString) {
    if (!timeString) return "";

    const [hours, minutes] = timeString
      .split(":")
      .map(Number);

    const date = new Date();

    date.setHours(hours, minutes, 0, 0);

    return date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const confirmedBookings = useMemo(
    () =>
      bookings.filter(
        (booking) => booking.status === "CONFIRMED"
      ),
    [bookings]
  );

  const upcomingBooking = useMemo(() => {
    const confirmed = confirmedBookings.filter((booking) => {
      return true;
    });

    return confirmed.length > 0 ? confirmed[0] : null;
  }, [confirmedBookings]);

  const upcomingEvents = useMemo(() => {
    return [...events]
      .filter(
        (event) =>
          event.status !== "CANCELLED" &&
          event.status !== "COMPLETED"
      )
      .slice(0, 3);
  }, [events]);

  const unreadNotifications = useMemo(
    () =>
      notifications.filter(
        (notification) => !notification.is_read
      ),
    [notifications]
  );

  const latestNotification =
    notifications.length > 0
      ? notifications[0]
      : null;

  if (loading) {
    return (
      <main className="customer-home">
        <section className="home-loading">
          <p>Loading your LaughTicket...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="customer-home">
      {error && (
        <div className="home-error">
          {error}
        </div>
      )}

      {/* HERO */}
      <section className="customer-home-hero">
        <div>
          <p className="dashboard-label">
            WELCOME BACK
          </p>

          <h1>
            Ready for your next
            <br />
            <span>comedy night?</span>
          </h1>

          <p className="home-hero-subtitle">
            Discover live comedy shows, manage your
            tickets and never miss your next laugh.
          </p>

          <div className="home-hero-actions">
            <button
              className="primary-button"
              onClick={() => navigate("/events")}
            >
              Explore Events
            </button>

            <button
              className="secondary-button"
              onClick={() =>
                navigate("/customer/dashboard")
              }
            >
              My Bookings
            </button>
          </div>
        </div>

        <div className="home-hero-decoration">
          <div className="hero-mask">🎭</div>
          <span>LIVE</span>
          <strong>COMEDY</strong>
        </div>
      </section>

      {/* NEXT SHOW */}
      <section className="home-section">
        <div className="home-section-heading">
          <div>
            <p className="dashboard-label">
              YOUR NEXT SHOW
            </p>

            <h2>Don't miss the laugh.</h2>
          </div>

          {upcomingBooking && (
            <button
              className="text-button"
              onClick={() =>
                navigate(
                  `/ticket/${upcomingBooking.id}`
                )
              }
            >
              View Ticket →
            </button>
          )}
        </div>

        {upcomingBooking ? (
          <article className="next-show-card">
            <div className="next-show-content">
              <span className="home-status">
                CONFIRMED
              </span>

              <h3>
                {upcomingBooking.event_title}
              </h3>

              <div className="next-show-details">
                <div>
                  <span>BOOKING</span>
                  <strong>
                    #{upcomingBooking.id}
                  </strong>
                </div>

                <div>
                  <span>SEATS</span>
                  <strong>
                    {upcomingBooking.items?.length || 0}
                  </strong>
                </div>

                <div>
                  <span>TOTAL</span>
                  <strong>
                    ₹
                    {Number(
                      upcomingBooking.total_amount
                    ).toFixed(2)}
                  </strong>
                </div>
              </div>

              <div className="next-show-seats">
                {upcomingBooking.items?.map((item) => (
                  <span
                    className="seat-chip"
                    key={item.seat_id}
                  >
                    {item.seat_label}
                  </span>
                ))}
              </div>
            </div>

            <div className="next-show-action">
              <button
                className="primary-button"
                onClick={() =>
                  navigate(
                    `/ticket/${upcomingBooking.id}`
                  )
                }
              >
                View Ticket 🎟️
              </button>

              <button
                className="secondary-button"
                onClick={() =>
                  navigate(
                    `/events/${upcomingBooking.event_id}`
                  )
                }
              >
                View Event
              </button>
            </div>
          </article>
        ) : (
          <div className="home-empty-card">
            <div>
              <span className="empty-card-icon">
                🎟️
              </span>

              <h3>No upcoming bookings</h3>

              <p>
                Your next comedy adventure is waiting
                for you.
              </p>
            </div>

            <button
              className="primary-button"
              onClick={() => navigate("/events")}
            >
              Find a Show
            </button>
          </div>
        )}
      </section>

      {/* UPCOMING EVENTS */}
      <section className="home-section">
        <div className="home-section-heading">
          <div>
            <p className="dashboard-label">
              DISCOVER
            </p>

            <h2>Upcoming Comedy Shows</h2>
          </div>

          <button
            className="text-button"
            onClick={() => navigate("/events")}
          >
            View All →
          </button>
        </div>

        {upcomingEvents.length > 0 ? (
          <div className="home-event-grid">
            {upcomingEvents.map((event) => (
              <article
                className="home-event-card"
                key={event.id}
              >
                <div className="home-event-poster">
                  {event.poster_url ? (
                    <img
                      src={event.poster_url}
                      alt={event.title}
                    />
                  ) : (
                    <div className="home-event-fallback">
                      🎭
                    </div>
                  )}

                  <span>
                    {event.event_format}
                  </span>
                </div>

                <div className="home-event-content">
                  <h3>{event.title}</h3>

                  <p>
                    {formatDate(event.event_date)}
                    {event.start_time &&
                      ` • ${formatTime(
                        event.start_time
                      )}`}
                  </p>

                  <div className="home-event-footer">
                    <strong>
                      ₹
                      {Number(
                        event.ticket_price
                      ).toFixed(0)}
                    </strong>

                    <button
                      className="text-button"
                      onClick={() =>
                        navigate(
                          `/events/${event.id}`
                        )
                      }
                    >
                      View →
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="home-empty-card">
            <div>
              <h3>No upcoming shows</h3>
              <p>
                Check back soon for new comedy
                events.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* ACTIVITY */}
      <section className="home-section">
        <div className="home-section-heading">
          <div>
            <p className="dashboard-label">
              YOUR ACTIVITY
            </p>

            <h2>LaughTicket at a glance</h2>
          </div>
        </div>

        <div className="home-stats-grid">
          <div className="home-stat-card">
            <span>BOOKINGS</span>
            <strong>{bookings.length}</strong>
            <p>Total bookings</p>
          </div>

          <div className="home-stat-card">
            <span>CONFIRMED</span>
            <strong>
              {confirmedBookings.length}
            </strong>
            <p>Confirmed bookings</p>
          </div>

          <div className="home-stat-card">
            <span>UNREAD</span>
            <strong>
              {unreadNotifications.length}
            </strong>
            <p>New notifications</p>
          </div>
        </div>
      </section>

      {/* NOTIFICATION */}
      <section className="home-section">
        <div className="home-section-heading">
          <div>
            <p className="dashboard-label">
              LATEST UPDATE
            </p>

            <h2>What's happening?</h2>
          </div>

          <button
            className="text-button"
            onClick={() =>
              navigate("/notifications")
            }
          >
            All Notifications →
          </button>
        </div>

        {latestNotification ? (
          <article className="home-notification-card">
            <div className="home-notification-icon">
              🔔
            </div>

            <div>
              <div className="home-notification-title">
                <h3>
                  {latestNotification.title ||
                    "Notification"}
                </h3>

                {!latestNotification.is_read && (
                  <span className="home-unread-dot" />
                )}
              </div>

              <p>
                {latestNotification.message}
              </p>

              <small>
                {formatDate(
                  latestNotification.created_at
                )}
              </small>
            </div>
          </article>
        ) : (
          <div className="home-notification-card">
            <div className="home-notification-icon">
              🎉
            </div>

            <div>
              <h3>You're all caught up</h3>
              <p>
                New booking updates and event
                reminders will appear here.
              </p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default CustomerHome;