import { useEffect, useState } from "react";
import {
  getNotifications,
  markNotificationAsRead,
} from "../api/notifications";

function getNotificationTitle(type) {
  switch (type) {
    case "EVENT_REMINDER":
      return "🎭 Event Reminder";

    case "RESERVATION_EXPIRED":
      return "⏰ Reservation Expired";

    case "BOOKING_CONFIRMED":
      return "🎟️ Booking Confirmed";

    case "BOOKING_CANCELLED":
      return "❌ Booking Cancelled";

    case "EVENT_CANCELLED":
      return "⚠️ Event Cancelled";

    default:
      return "🔔 Notification";
  }
}

function getNotificationClass(type) {
  switch (type) {
    case "EVENT_REMINDER":
      return "notification-reminder";

    case "BOOKING_CONFIRMED":
      return "notification-success";

    case "BOOKING_CANCELLED":
    case "EVENT_CANCELLED":
      return "notification-warning";

    case "RESERVATION_EXPIRED":
      return "notification-expired";

    default:
      return "";
  }
}

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadNotifications() {
    try {
      setLoading(true);
      setError("");

      const data = await getNotifications();

      setNotifications(data);
    } catch (err) {
      console.error("Failed to load notifications:", err);
      setError("Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsRead(notificationId) {
    try {
      await markNotificationAsRead(notificationId);

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                is_read: true,
              }
            : notification
        )
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  const reminderCount = notifications.filter(
    (notification) =>
      notification.notification_type === "EVENT_REMINDER"
  ).length;

  if (loading) {
    return (
      <main className="app">
        <section className="page-section">
          <div className="empty-state">
            <h2>Loading notifications...</h2>
            <p>Please wait while we fetch your latest updates.</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="app">
      <section className="page-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Stay Updated</p>
            <h1>Notifications</h1>
            <p className="notification-subtitle">
              Booking updates, reminders and important event information.
            </p>
          </div>

          <div className="notification-summary">
            <span>{unreadCount} unread</span>

            {reminderCount > 0 && (
              <span>{reminderCount} reminders</span>
            )}
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {!error && notifications.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🔔</div>

            <h2>You're all caught up</h2>

            <p>
              New booking updates and event reminders will appear here.
            </p>
          </div>
        )}

        {!error && notifications.length > 0 && (
          <div className="notification-list">
            {notifications.map((notification) => (
              <article
                key={notification.id}
                className={`notification-card ${
                  notification.is_read ? "read" : "unread"
                } ${getNotificationClass(
                  notification.notification_type
                )}`}
              >
                <div className="notification-content">
                  <div className="notification-header">
                    <h3>
                      {getNotificationTitle(
                        notification.notification_type
                      )}
                    </h3>

                    {!notification.is_read && (
                      <span
                        className="unread-dot"
                        title="Unread"
                      />
                    )}
                  </div>

                  <p>{notification.message}</p>

                  {notification.created_at && (
                    <small>
                      {new Date(
                        notification.created_at
                      ).toLocaleString()}
                    </small>
                  )}
                </div>

                {!notification.is_read && (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() =>
                      handleMarkAsRead(notification.id)
                    }
                  >
                    Mark as read
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default Notifications;