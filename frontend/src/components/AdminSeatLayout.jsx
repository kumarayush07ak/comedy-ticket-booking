import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getVenues } from "../api/venues";
import {
  getSeatLayout,
  createOrReplaceSeatLayout,
} from "../api/seats";

function AdminSeatLayout() {
  const { venueId } = useParams();
  const navigate = useNavigate();

  const [venue, setVenue] = useState(null);
  const [layout, setLayout] = useState(null);

  const [rows, setRows] = useState([
    {
      row_label: "A",
      seat_count: 10,
    },
  ]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadData();
  }, [venueId]);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [venues, existingLayout] = await Promise.all([
        getVenues(),
        getSeatLayout(venueId),
      ]);

      const selectedVenue = venues.find(
        (item) => item.id === Number(venueId)
      );

      setVenue(selectedVenue || null);
      setLayout(existingLayout);

      if (
        existingLayout &&
        existingLayout.rows &&
        Object.keys(existingLayout.rows).length > 0
      ) {
        const existingRows = Object.entries(existingLayout.rows).map(
          ([rowLabel, seats]) => ({
            row_label: rowLabel,
            seat_count: seats.length,
          })
        );

        setRows(existingRows);
      }
    } catch (err) {
      console.error(err);

      if (err.response?.status === 404) {
        setError("Venue or seat layout was not found.");
      } else if (err.response?.status === 401) {
        setError("Your session has expired. Please login again.");
      } else if (err.response?.status === 403) {
        setError("You do not have permission to manage seat layouts.");
      } else {
        setError(
          err.response?.data?.detail ||
            "Failed to load seat layout."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  function handleRowChange(index, field, value) {
    setRows((currentRows) =>
      currentRows.map((row, rowIndex) =>
        rowIndex === index
          ? {
              ...row,
              [field]:
                field === "seat_count"
                  ? Number(value)
                  : value,
            }
          : row
      )
    );
  }

  function addRow() {
    setRows((currentRows) => [
      ...currentRows,
      {
        row_label: "",
        seat_count: 10,
      },
    ]);
  }

  function removeRow(index) {
    if (rows.length === 1) {
      setError("At least one row is required.");
      return;
    }

    setRows((currentRows) =>
      currentRows.filter((_, rowIndex) => rowIndex !== index)
    );
  }

  async function handleSave() {
    setError("");
    setSuccess("");

    const cleanedRows = rows.map((row) => ({
      row_label: row.row_label.trim(),
      seat_count: Number(row.seat_count),
    }));

    if (
      cleanedRows.some(
        (row) =>
          !row.row_label ||
          row.seat_count <= 0 ||
          row.seat_count > 100
      )
    ) {
      setError(
        "Every row needs a label and seat count between 1 and 100."
      );
      return;
    }

    const labels = cleanedRows.map((row) => row.row_label.toUpperCase());

    if (new Set(labels).size !== labels.length) {
      setError("Row labels must be unique.");
      return;
    }

    const payload = {
      rows: cleanedRows.map((row) => ({
        row_label: row.row_label.toUpperCase(),
        seat_count: row.seat_count,
      })),
    };

    try {
      setSaving(true);

      const response = await createOrReplaceSeatLayout(
        venueId,
        payload
      );

      setLayout(response);

      setRows(
        Object.entries(response.rows || {}).map(
          ([rowLabel, seats]) => ({
            row_label: rowLabel,
            seat_count: seats.length,
          })
        )
      );

      setSuccess("Seat layout saved successfully.");
    } catch (err) {
      console.error(err);

      if (err.response?.status === 401) {
        setError("Your session has expired. Please login again.");
      } else if (err.response?.status === 403) {
        setError("Only an admin can modify seat layouts.");
      } else if (err.response?.status === 404) {
        setError("Venue not found.");
      } else if (err.response?.status === 409) {
        setError(
          err.response?.data?.detail ||
            "The seat layout cannot be changed because this venue already has events."
        );
      } else {
        setError(
          err.response?.data?.detail ||
            "Failed to save seat layout."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="page-container">
        <div className="management-card">
          <p>Loading seat layout...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page-container">
      <section className="management-header">
        <div>
          <button
            className="secondary-button"
            onClick={() => navigate("/admin/venues")}
          >
            ← Back to Venues
          </button>

          <h1>Seat Layout</h1>

          <p>
            {venue
              ? `Manage physical seats for ${venue.name}`
              : `Venue #${venueId}`}
          </p>
        </div>
      </section>

      {error && (
        <div className="management-alert error-alert">
          {error}
        </div>
      )}

      {success && (
        <div className="management-alert success-alert">
          {success}
        </div>
      )}

      <section className="management-card">
        <div className="management-card-header">
          <div>
            <h2>Configure Rows</h2>
            <p>
              Define each physical row and the number of seats in it.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={addRow}
          >
            + Add Row
          </button>
        </div>

        <div className="seat-row-editor">
          {rows.map((row, index) => (
            <div className="seat-row-form" key={index}>
              <div className="form-group">
                <label>Row Label</label>

                <input
                  type="text"
                  value={row.row_label}
                  maxLength={10}
                  placeholder="A"
                  onChange={(event) =>
                    handleRowChange(
                      index,
                      "row_label",
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="form-group">
                <label>Seat Count</label>

                <input
                  type="number"
                  min="1"
                  max="100"
                  value={row.seat_count}
                  onChange={(event) =>
                    handleRowChange(
                      index,
                      "seat_count",
                      event.target.value
                    )
                  }
                />
              </div>

              <button
                className="danger-button"
                onClick={() => removeRow(index)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="seat-layout-summary">
          <strong>
            Total seats:{" "}
            {rows.reduce(
              (total, row) => total + Number(row.seat_count || 0),
              0
            )}
          </strong>
        </div>

        <button
          className="primary-button"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Seat Layout"}
        </button>
      </section>

      {layout && (
        <section className="management-card">
          <div className="management-card-header">
            <div>
              <h2>Current Seat Layout</h2>
              <p>
                {layout.total_seats} physical seats
              </p>
            </div>
          </div>

          <div className="seat-layout-preview">
            {Object.entries(layout.rows || {}).map(
              ([rowLabel, seats]) => (
                <div
                  className="seat-preview-row"
                  key={rowLabel}
                >
                  <div className="seat-row-label">
                    {rowLabel}
                  </div>

                  <div className="seat-list">
                    {seats.map((seat) => (
                      <div
                        className="seat-item"
                        key={seat.id}
                        title={seat.seat_label}
                      >
                        {seat.seat_number}
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        </section>
      )}
    </main>
  );
}

export default AdminSeatLayout;