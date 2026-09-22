import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { scanTicket } from "../api/scanner";

function AdminScanner() {
  const navigate = useNavigate();

  const [qrToken, setQrToken] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const scannerRef = useRef(null);
  const scanningRef = useRef(false);

  async function stopCamera() {
    if (!scannerRef.current) {
      setCameraActive(false);
      scanningRef.current = false;
      return;
    }

    try {
      if (scanningRef.current) {
        await scannerRef.current.stop();
      }

      await scannerRef.current.clear();
    } catch (err) {
      console.error("Camera stop error:", err);
    } finally {
      scannerRef.current = null;
      scanningRef.current = false;
      setCameraActive(false);
    }
  }

  async function handleQrDetected(decodedText) {
    if (!decodedText || loading || !scanningRef.current) {
      return;
    }

    scanningRef.current = false;

    await stopCamera();

    setQrToken(decodedText);
    setError("");
    setResult(null);

    await validateTicket(decodedText);
  }

  async function validateTicket(token) {
    if (!token.trim()) {
      setError("Please enter or scan a QR token.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);

      const data = await scanTicket(token.trim());

      setResult(data);
      setQrToken("");
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Unable to validate this ticket."
      );
    } finally {
      setLoading(false);
    }
  }

  async function startCamera() {
    try {
      setCameraError("");
      setError("");
      setResult(null);

      if (scannerRef.current) {
        await stopCamera();
      }

      const scanner = new Html5Qrcode("qr-reader");

      scannerRef.current = scanner;
      scanningRef.current = true;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: {
            width: 250,
            height: 250,
          },
          aspectRatio: 1.0,
        },
        async (decodedText) => {
          await handleQrDetected(decodedText);
        },
        () => {
          // QR not detected yet.
          // This callback runs repeatedly while scanning.
        }
      );

      setCameraActive(true);
    } catch (err) {
      console.error("Camera start error:", err);

      scannerRef.current = null;
      scanningRef.current = false;
      setCameraActive(false);

      setCameraError(
        "Unable to access the camera. Please allow camera permission and try again."
      );
    }
  }

  async function handleManualSubmit(event) {
    event.preventDefault();

    await stopCamera();
    await validateTicket(qrToken.trim());
  }

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch(() => {})
          .finally(() => {
            scannerRef.current?.clear().catch(() => {});
          });
      }
    };
  }, []);

  return (
    <main className="scanner-page">
      <section className="scanner-card">
        <div className="scanner-header">
          <p className="dashboard-label">ADMIN SCANNER</p>

          <h1>
            Scan
            <br />
            <span>Ticket.</span>
          </h1>

          <p>
            Scan the customer's QR code using your camera,
            or enter the secure QR token manually.
          </p>
        </div>

        {/* CAMERA SCANNER */}
        <div className="camera-scanner-section">
          <div className="scanner-section-title">
            <span>CAMERA SCANNER</span>
          </div>

          <div
            id="qr-reader"
            className={`qr-reader ${
              cameraActive ? "qr-reader-active" : ""
            }`}
          />

          {!cameraActive && (
            <div className="camera-placeholder">
              <div className="camera-icon">📷</div>

              <h3>Camera scanner</h3>

              <p>
                Use your device camera to scan the customer's
                QR ticket.
              </p>

              <button
                type="button"
                className="primary-button scanner-camera-button"
                onClick={startCamera}
                disabled={loading}
              >
                Start Camera
              </button>
            </div>
          )}

          {cameraActive && (
            <button
              type="button"
              className="secondary-button scanner-stop-button"
              onClick={stopCamera}
              disabled={loading}
            >
              Stop Camera
            </button>
          )}

          {cameraError && (
            <div className="scanner-camera-error">
              {cameraError}
            </div>
          )}
        </div>

        {/* MANUAL TOKEN FALLBACK */}
        <div className="scanner-divider">
          <span>OR ENTER TOKEN MANUALLY</span>
        </div>

        <form
          className="scanner-form"
          onSubmit={handleManualSubmit}
        >
          <label htmlFor="qr-token">
            QR Token
          </label>

          <textarea
            id="qr-token"
            value={qrToken}
            onChange={(event) =>
              setQrToken(event.target.value)
            }
            placeholder="Paste QR token here..."
            rows="4"
            disabled={loading}
          />

          <button
            type="submit"
            className="primary-button scanner-button"
            disabled={loading}
          >
            {loading ? "Validating..." : "Validate Ticket"}
          </button>
        </form>

        {/* ERROR */}
        {error && (
          <div className="scanner-result scanner-error">
            <div className="scanner-result-icon">✕</div>

            <div>
              <h3>Ticket validation failed</h3>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* SUCCESS */}
        {result && (
          <div className="scanner-result scanner-success">
            <div className="scanner-result-icon">✓</div>

            <div className="scanner-result-content">
              <h3>{result.message}</h3>

              <div className="scanner-details">
                <div>
                  <span>Ticket</span>
                  <strong>{result.ticket_number}</strong>
                </div>

                <div>
                  <span>Booking</span>
                  <strong>#{result.booking_id}</strong>
                </div>

                <div>
                  <span>Status</span>
                  <strong>{result.status}</strong>
                </div>

                {result.used_at && (
                  <div>
                    <span>Used At</span>

                    <strong>
                      {new Date(
                        result.used_at
                      ).toLocaleString("en-IN")}
                    </strong>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          className="secondary-button scanner-back-button"
          onClick={() => navigate("/admin/dashboard")}
        >
          ← Back to Dashboard
        </button>
      </section>
    </main>
  );
}

export default AdminScanner;