import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../api/auth";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    try {
      setLoading(true);

      await registerUser(
        formData.name.trim(),
        formData.email.trim(),
        formData.password
      );

      setSuccess(
        "Account created successfully! Please check your email and verify your account before logging in."
      );
    } catch (err) {
      console.error(err);

      const detail = err.response?.data?.detail;

      if (Array.isArray(detail)) {
        setError(
          detail
            .map((item) => item.msg)
            .join(", ")
        );
      } else {
        setError(
          detail || "Unable to create your account."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-header">
          <p className="dashboard-label">
            LAUGHTICKET
          </p>

          <h1>
            Create your
            <br />
            <span>account.</span>
          </h1>

          <p>
            Join LaughTicket and start booking your
            favourite comedy shows.
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          <div className="form-group">
            <label htmlFor="name">
              Full Name
            </label>

            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
              minLength={2}
              maxLength={100}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimum 8 characters"
              minLength={8}
              maxLength={128}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">
              Confirm Password
            </label>

            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Enter your password again"
              minLength={8}
              maxLength={128}
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="auth-message auth-error">
              {error}
            </div>
          )}

          {success && (
            <div className="auth-message auth-success">
              {success}
            </div>
          )}

          <button
            type="submit"
            className="primary-button auth-submit"
            disabled={loading || Boolean(success)}
          >
            {loading
              ? "Creating Account..."
              : success
                ? "Check Your Email"
                : "Create Account"}
          </button>
        </form>

        <div className="auth-footer">
          <span>
            Already have an account?
          </span>

          <button
            type="button"
            className="auth-link"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
        </div>
      </section>
    </main>
  );
}

export default Register;