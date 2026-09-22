import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { getNotifications } from "../api/notifications";

function Navbar({
  isLoggedIn,
  userRole,
  onLogout,
}) {
  const [unreadCount, setUnreadCount] = useState(0);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    async function loadUnreadCount() {
      const token =
        localStorage.getItem("access_token");

      if (!token || userRole !== "CUSTOMER") {
        setUnreadCount(0);
        return;
      }

      try {
        const notifications =
          await getNotifications();

        const unread = notifications.filter(
          (notification) => !notification.is_read
        ).length;

        setUnreadCount(unread);
      } catch (error) {
        console.error(
          "Failed to load unread notifications:",
          error
        );

        setUnreadCount(0);
      }
    }

    loadUnreadCount();
  }, [location.pathname, userRole]);

  function handleLogout() {
    if (onLogout) {
      onLogout();
    }

    localStorage.removeItem("access_token");
    localStorage.removeItem("user_role");

    setUnreadCount(0);

    navigate("/login");
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">

        {/* BRAND */}

        <Link
          to="/"
          className="navbar-brand"
        >
          <span className="brand-icon">
            🎭
          </span>

          <span>
            LaughTicket
          </span>
        </Link>

        {/* NAVIGATION */}

        <div className="navbar-links">

          {/* PUBLIC */}

          <Link
            to="/"
            className={
              location.pathname === "/"
                ? "active"
                : ""
            }
          >
            Home
          </Link>

          <Link
            to="/events"
            className={
              location.pathname === "/events"
                ? "active"
                : ""
            }
          >
            Events
          </Link>

          {/* CUSTOMER ONLY */}

          {isLoggedIn &&
            userRole === "CUSTOMER" && (
              <>
                <Link
                  to="/customer/dashboard"
                  className={
                    location.pathname ===
                    "/customer/dashboard"
                      ? "active"
                      : ""
                  }
                >
                  Dashboard
                </Link>

                <Link
                  to="/notifications"
                  className={
                    location.pathname ===
                    "/notifications"
                      ? "active"
                      : ""
                  }
                >
                  Notifications

                  {unreadCount > 0 && (
                    <span className="notification-badge">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              </>
            )}

          {/* ADMIN ONLY */}

          {isLoggedIn &&
            userRole === "ADMIN" && (
              <>
                <Link
                  to="/admin/dashboard"
                  className={
                    location.pathname ===
                    "/admin/dashboard"
                      ? "active"
                      : ""
                  }
                >
                  Dashboard
                </Link>

                <Link
                  to="/admin/cities"
                  className={
                    location.pathname ===
                    "/admin/cities"
                      ? "active"
                      : ""
                  }
                >
                  Cities
                </Link>

                <Link
                  to="/admin/venues"
                  className={
                    location.pathname ===
                    "/admin/venues"
                      ? "active"
                      : ""
                  }
                >
                  Venues
                </Link>

                <Link
                  to="/admin/events"
                  className={
                    location.pathname ===
                    "/admin/events"
                      ? "active"
                      : ""
                  }
                >
                  Manage Events
                </Link>
                <Link to="/admin/scanner">Scanner</Link>
              </>
            )}

        </div>

        {/* AUTH */}

        <div className="navbar-auth">

          {!isLoggedIn ? (
            <>
              <Link
                to="/login"
                className="navbar-login"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="navbar-register"
              >
                Register
              </Link>
            </>
          ) : (
            <button
              className="navbar-logout"
              onClick={handleLogout}
            >
              Logout
            </button>
          )}

        </div>

      </div>
    </nav>
  );
}

export default Navbar;