import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function VerifyEmail() {
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing.");
      return;
    }

    async function verifyEmail() {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/auth/verify-email`,
          {
            params: { token },
          }
        );

        setStatus("success");
        setMessage(response.data.message);
      } catch (error) {
        console.error(error);

        setStatus("error");
        setMessage(
          error.response?.data?.detail ||
            "This verification link is invalid or has expired."
        );
      }
    }

    verifyEmail();
  }, [searchParams]);

  return (
    <main className="auth-page">
      <section className="auth-card verify-email-card">
        {status === "verifying" && (
          <>
            <div className="verify-icon">
              ⏳
            </div>

            <h1>Verifying Email</h1>

            <p>
              Please wait while we verify your
              email address.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="verify-icon success">
              ✓
            </div>

            <h1>Email Verified!</h1>

            <p>{message}</p>

            <Link
              to="/login"
              className="auth-button"
            >
              Continue to Login
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="verify-icon error">
              !
            </div>

            <h1>Verification Link Unavailable</h1>

            <p>{message}</p>

            <p className="verify-help-text">
              If you have already verified your email,
              you can simply continue to login.
            </p>

            <Link
              to="/login"
              className="auth-button"
            >
              Go to Login
            </Link>
          </>
        )}
      </section>
    </main>
  );
}

export default VerifyEmail;