import { useEffect, useState } from "react";
import { getAdminDashboard } from "../api/adminDashboard";

function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const token = localStorage.getItem("access_token");

        if (!token) {
          setError("Admin login token not found.");
          return;
        }

        const data = await getAdminDashboard(token);

        setDashboard(data);
      } catch (err) {
        console.error("Failed to load admin dashboard:", err);

        if (err.response?.status === 401) {
          setError("Authentication required.");
        } else if (err.response?.status === 403) {
          setError("Admin access required.");
        } else {
          setError("Unable to load dashboard.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <main className="app">
        <section className="admin-dashboard">
          <div className="dashboard-message">
            <div className="dashboard-loading-icon">📊</div>
            <h2>Loading dashboard...</h2>
            <p>Fetching the latest platform statistics.</p>
          </div>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="app">
        <section className="admin-dashboard">
          <div className="dashboard-error">
            <div className="dashboard-error-icon">⚠️</div>
            <h2>Dashboard unavailable</h2>
            <p>{error}</p>
          </div>
        </section>
      </main>
    );
  }

  const stats = [
    {
      title: "Total Customers",
      value: dashboard.total_customers,
      icon: "👥",
      category: "Users",
    },
    {
      title: "Total Cities",
      value: dashboard.total_cities,
      icon: "🏙️",
      category: "Locations",
    },
    {
      title: "Total Venues",
      value: dashboard.total_venues,
      icon: "🏟️",
      category: "Locations",
    },
    {
      title: "Upcoming Events",
      value: dashboard.upcoming_events,
      icon: "🎭",
      category: "Events",
    },
    {
      title: "Total Bookings",
      value: dashboard.total_bookings,
      icon: "🎟️",
      category: "Bookings",
    },
    {
      title: "Confirmed Bookings",
      value: dashboard.confirmed_bookings,
      icon: "✅",
      category: "Bookings",
    },
    {
      title: "Revenue",
      value: `₹${Number(dashboard.revenue || 0).toLocaleString("en-IN")}`,
      icon: "💰",
      category: "Finance",
    },
    {
      title: "Available Seats",
      value: dashboard.available_seats,
      icon: "💺",
      category: "Seats",
    },
    {
      title: "Tickets Scanned",
      value: dashboard.tickets_scanned,
      icon: "📱",
      category: "Tickets",
    },
  ];

  const bookingConfirmationRate =
    dashboard.total_bookings > 0
      ? Math.round(
          (dashboard.confirmed_bookings /
            dashboard.total_bookings) *
            100
        )
      : 0;

  return (
    <main className="app">
      <section className="admin-dashboard">
        {/* Header */}
        <div className="dashboard-header admin-dashboard-header">
          <div>
            <p className="dashboard-label">ADMIN PANEL</p>

            <h1>Dashboard</h1>

            <p>
              Overview of your comedy ticket booking platform.
            </p>
          </div>

          <div className="admin-status">
            <span className="admin-status-dot" />
            System Active
          </div>
        </div>

        {/* Main statistics */}
        <div className="dashboard-grid">
          {stats.map((stat) => (
            <div
              className="dashboard-card admin-stat-card"
              key={stat.title}
            >
              <div className="admin-stat-top">
                <span className="admin-stat-icon">
                  {stat.icon}
                </span>

                <span className="admin-stat-category">
                  {stat.category}
                </span>
              </div>

              <p>{stat.title}</p>

              <h2>{stat.value}</h2>
            </div>
          ))}
        </div>

        {/* Booking overview */}
        <section className="admin-overview-section">
          <div className="admin-section-header">
            <div>
              <p className="dashboard-label">BOOKING ANALYTICS</p>
              <h2>Booking Overview</h2>
            </div>
          </div>

          <div className="booking-overview-card">
            <div className="booking-overview-main">
              <span>Confirmed booking rate</span>

              <strong>{bookingConfirmationRate}%</strong>
            </div>

            <div className="booking-progress">
              <div
                className="booking-progress-fill"
                style={{
                  width: `${bookingConfirmationRate}%`,
                }}
              />
            </div>

            <div className="booking-overview-details">
              <div>
                <span>Total bookings</span>
                <strong>{dashboard.total_bookings}</strong>
              </div>

              <div>
                <span>Confirmed</span>
                <strong>{dashboard.confirmed_bookings}</strong>
              </div>

              <div>
                <span>Available seats</span>
                <strong>{dashboard.available_seats}</strong>
              </div>

              <div>
                <span>Tickets scanned</span>
                <strong>{dashboard.tickets_scanned}</strong>
              </div>
            </div>
          </div>
        </section>

        {/* Platform overview */}
        <section className="admin-overview-section">
          <div className="admin-section-header">
            <div>
              <p className="dashboard-label">PLATFORM</p>
              <h2>Platform Overview</h2>
            </div>
          </div>

          <div className="platform-overview-grid">
            <div className="platform-overview-card">
              <span className="overview-icon">👥</span>

              <div>
                <strong>{dashboard.total_customers}</strong>
                <span>Customers</span>
              </div>
            </div>

            <div className="platform-overview-card">
              <span className="overview-icon">📍</span>

              <div>
                <strong>{dashboard.total_cities}</strong>
                <span>Cities</span>
              </div>
            </div>

            <div className="platform-overview-card">
              <span className="overview-icon">🏟️</span>

              <div>
                <strong>{dashboard.total_venues}</strong>
                <span>Venues</span>
              </div>
            </div>

            <div className="platform-overview-card">
              <span className="overview-icon">🎭</span>

              <div>
                <strong>{dashboard.upcoming_events}</strong>
                <span>Upcoming Events</span>
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

export default AdminDashboard;