import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  loginUser,
  getCurrentUser,
} from "../api/auth";

function AdminLogin({ onLogin }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const data = await loginUser(
        normalizedEmail,
        password
      );

      const token = data.access_token;

      if (!token) {
        setError(
          "Login succeeded but no access token was returned."
        );
        return;
      }

      const user = await getCurrentUser(token);
      const role = user.role;

      if (!role) {
        setError(
          "Unable to determine account role."
        );
        return;
      }

      onLogin(token, role);

      if (role === "ADMIN") {
        navigate("/admin/dashboard");
      } else if (role === "CUSTOMER") {
        navigate("/customer/dashboard");
      } else {
        setError("Unsupported account role.");
      }
    } catch (err) {
      console.error(err);

      if (err.response?.status === 401) {
        setError("Invalid email or password.");
      } else if (err.response?.status === 403) {
        setError(
          err.response?.data?.detail ||
            "Your account cannot access the platform."
        );
      } else if (!err.response) {
        setError(
          "Unable to connect to the server. Make sure the backend is running."
        );
      } else {
        setError(
          err.response?.data?.detail ||
            "Something went wrong while signing in."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <form
        className="login-card"
        onSubmit={handleSubmit}
      >
        <p className="dashboard-label">
          WELCOME TO LAUGHTICKET
        </p>

        <h1>Sign in</h1>

        <p className="login-description">
          Access your comedy events, bookings and tickets
          in one place.
        </p>

        <label htmlFor="email">
          Email address
        </label>

        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
          placeholder="you@example.com"
          autoComplete="email"
          required
          disabled={loading}
        />

        <label htmlFor="password">
          Password
        </label>

        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) =>
            setPassword(event.target.value)
          }
          placeholder="Enter your password"
          autoComplete="current-password"
          required
          disabled={loading}
        />

        {error && (
          <p className="login-error">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Signing in..."
            : "Sign In"}
        </button>

        <p className="auth-switch">
          Don't have an account?{" "}
          <Link to="/register">
            Create one
          </Link>
        </p>
      </form>
    </main>
  );
}

export default AdminLogin;