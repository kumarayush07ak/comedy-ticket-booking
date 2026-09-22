import { useState } from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import CustomerDashboard from "./components/CustomerDashboard";
import Notifications from "./components/Notifications";
import AdminCities from "./components/AdminCities";
import AdminVenues from "./components/AdminVenues";
import AdminSeatLayout from "./components/AdminSeatLayout";
import AdminEvents from "./components/AdminEvents";
import AdminScanner from "./components/AdminScanner";
import Events from "./components/Events";
import EventDetails from "./components/EventDetails";
import Booking from "./components/Booking";
import Ticket from "./components/Ticket";
import Register from "./components/Register";
import CustomerHome from "./components/CustomerHome";
import VerifyEmail from "./components/VerifyEmail";

import "./App.css";

function App() {
  const [token, setToken] = useState(
    localStorage.getItem("access_token")
  );

  const [role, setRole] = useState(
    localStorage.getItem("user_role")
  );

  const handleLogin = (newToken, userRole) => {
    localStorage.setItem("access_token", newToken);
    localStorage.setItem("user_role", userRole);

    setToken(newToken);
    setRole(userRole);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_role");

    setToken(null);
    setRole(null);
  };

  const isLoggedIn = Boolean(token);

  return (
    <BrowserRouter>
      <Navbar
        isLoggedIn={isLoggedIn}
        userRole={role}
        onLogout={handleLogout}
      />

      <Routes>

        {/* =========================
            HOME
        ========================= */}

        <Route
          path="/"
          element={
            token && role === "CUSTOMER" ? (
              <CustomerHome />
            ) : token && role === "ADMIN" ? (
              <AdminDashboard />
            ) : (
              <main className="app">
                <section className="landing-page">
                  <p className="dashboard-label">
                    LIVE COMEDY EXPERIENCES
                  </p>

                  <h1>
                    Your next night
                    <br />
                    <span>starts with a laugh.</span>
                  </h1>

                  <p>
                    Discover stand-up shows, open mics and live
                    comedy events around you.
                  </p>
                </section>
              </main>
            )
          }
        />

        {/* =========================
            LOGIN
        ========================= */}

        <Route
          path="/login"
          element={
            <AdminLogin onLogin={handleLogin} />
          }
        />

        {/* =========================
            REGISTER
        ========================= */}

        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* =========================
            ADMIN DASHBOARD
        ========================= */}

        <Route
          path="/admin/dashboard"
          element={
            token && role === "ADMIN" ? (
              <AdminDashboard />
            ) : (
              <Navigate
                to="/login"
                replace
              />
            )
          }
        />

        {/* =========================
            ADMIN SCANNER
        ========================= */}

        <Route
          path="/admin/scanner"
          element={
            token && role === "ADMIN" ? (
              <AdminScanner />
            ) : (
              <Navigate
                to="/login"
                replace
              />
            )
          }
        />

        {/* =========================
            CUSTOMER DASHBOARD
        ========================= */}

        <Route
          path="/customer/dashboard"
          element={
            token && role === "CUSTOMER" ? (
              <CustomerDashboard />
            ) : (
              <Navigate
                to="/login"
                replace
              />
            )
          }
        />

        {/* =========================
            CUSTOMER EVENTS
        ========================= */}

        <Route
          path="/events"
          element={<Events />}
        />

        <Route
          path="/events/:eventId"
          element={<EventDetails />}
        />

        {/* =========================
            BOOKING
        ========================= */}

        <Route
          path="/booking/:reservationId"
          element={
            token && role === "CUSTOMER" ? (
              <Booking />
            ) : (
              <Navigate
                to="/login"
                replace
              />
            )
          }
        />

        {/* =========================
            TICKET
        ========================= */}

        <Route
          path="/ticket/:bookingId"
          element={
            token && role === "CUSTOMER" ? (
              <Ticket />
            ) : (
              <Navigate
                to="/login"
                replace
              />
            )
          }
        />

        {/* =========================
            NOTIFICATIONS
        ========================= */}

        <Route
          path="/notifications"
          element={
            token && role === "CUSTOMER" ? (
              <Notifications />
            ) : (
              <Navigate
                to="/login"
                replace
              />
            )
          }
        />

        {/* =========================
            ADMIN CITIES
        ========================= */}

        <Route
          path="/admin/cities"
          element={
            token && role === "ADMIN" ? (
              <AdminCities />
            ) : (
              <Navigate
                to="/login"
                replace
              />
            )
          }
        />

        {/* =========================
            ADMIN VENUES
        ========================= */}

        <Route
          path="/admin/venues"
          element={
            token && role === "ADMIN" ? (
              <AdminVenues />
            ) : (
              <Navigate
                to="/login"
                replace
              />
            )
          }
        />

        {/* =========================
            ADMIN SEAT LAYOUT
        ========================= */}

        <Route
          path="/admin/venues/:venueId/seats"
          element={
            token && role === "ADMIN" ? (
              <AdminSeatLayout />
            ) : (
              <Navigate
                to="/login"
                replace
              />
            )
          }
        />

        {/* =========================
            ADMIN EVENTS
        ========================= */}

        <Route
          path="/admin/events"
          element={
            token && role === "ADMIN" ? (
              <AdminEvents />
            ) : (
              <Navigate
                to="/login"
                replace
              />
            )
          }
        />

        {/* =========================
            404
        ========================= */}

        <Route
          path="*"
          element={
            <main className="app">
              <section className="placeholder-page">
                <p className="dashboard-label">
                  404
                </p>

                <h1>
                  Page not found
                </h1>

                <p>
                  The page you're looking for doesn't exist.
                </p>
              </section>
            </main>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;