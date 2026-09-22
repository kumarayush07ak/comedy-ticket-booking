import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCities } from "../api/cities";
import {
  getVenues,
  createVenue,
  updateVenue,
  deleteVenue,
} from "../api/venues";

function AdminVenues() {
  const navigate = useNavigate();
  const [cities, setCities] = useState([]);
  const [venues, setVenues] = useState([]);

  const [selectedCity, setSelectedCity] = useState("");

  const [form, setForm] = useState({
    name: "",
    city_id: "",
    address: "",
    description: "",
  });

  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [cityData, venueData] = await Promise.all([
        getCities(),
        getVenues(),
      ]);

      setCities(cityData);
      setVenues(venueData);
    } catch (err) {
      console.error("Failed to load venue data:", err);
      setError("Unable to load cities and venues.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm({
      name: "",
      city_id: "",
      address: "",
      description: "",
    });

    setEditingId(null);
  }

  function startEditing(venue) {
    clearMessages();

    setEditingId(venue.id);

    setForm({
      name: venue.name,
      city_id: String(venue.city_id),
      address: venue.address,
      description: venue.description || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    clearMessages();

    const name = form.name.trim();
    const address = form.address.trim();
    const description = form.description.trim();

    if (name.length < 2) {
      setError("Venue name must contain at least 2 characters.");
      return;
    }

    if (!form.city_id) {
      setError("Please select a city.");
      return;
    }

    if (address.length < 2) {
      setError("Venue address must contain at least 2 characters.");
      return;
    }

    const payload = {
      name,
      city_id: Number(form.city_id),
      address,
      description: description || null,
    };

    try {
      setSaving(true);

      if (editingId) {
        const updatedVenue = await updateVenue(
          editingId,
          payload
        );

        setVenues((current) =>
          current.map((venue) =>
            venue.id === editingId
              ? updatedVenue
              : venue
          )
        );

        setSuccess(
          `Venue "${updatedVenue.name}" updated successfully.`
        );
      } else {
        const newVenue = await createVenue(payload);

        setVenues((current) => [
          ...current,
          newVenue,
        ]);

        setSuccess(
          `Venue "${newVenue.name}" created successfully.`
        );
      }

      resetForm();
    } catch (err) {
      console.error("Failed to save venue:", err);

      if (err.response?.status === 409) {
        setError(
          err.response?.data?.detail ||
            "A venue with this name already exists in this city."
        );
      } else if (err.response?.status === 404) {
        setError(
          err.response?.data?.detail ||
            "The selected city was not found."
        );
      } else if (err.response?.status === 401) {
        setError("Authentication required.");
      } else if (err.response?.status === 403) {
        setError("Admin access required.");
      } else {
        setError(
          err.response?.data?.detail ||
            "Unable to save venue."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(venue) {
    clearMessages();

    const confirmed = window.confirm(
      `Delete "${venue.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);

      await deleteVenue(venue.id);

      setVenues((current) =>
        current.filter((item) => item.id !== venue.id)
      );

      if (editingId === venue.id) {
        resetForm();
      }

      setSuccess(
        `Venue "${venue.name}" deleted successfully.`
      );
    } catch (err) {
      console.error("Failed to delete venue:", err);

      if (err.response?.status === 409) {
        setError(
          err.response?.data?.detail ||
            "This venue cannot be deleted because it is being used by an event."
        );
      } else if (err.response?.status === 401) {
        setError("Authentication required.");
      } else if (err.response?.status === 403) {
        setError("Admin access required.");
      } else {
        setError(
          err.response?.data?.detail ||
            "Unable to delete venue."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  const filteredVenues = selectedCity
    ? venues.filter(
        (venue) =>
          venue.city_id === Number(selectedCity)
      )
    : venues;

  function getCityName(cityId) {
    const city = cities.find(
      (item) => item.id === cityId
    );

    return city ? city.name : `City #${cityId}`;
  }

  return (
    <main className="app">
      <section className="admin-management-page">
        {/* Header */}
        <div className="management-header">
          <div>
            <p className="dashboard-label">
              ADMIN PANEL
            </p>

            <h1>Venue Management</h1>

            <p>
              Create and manage comedy venues across your
              cities.
            </p>
          </div>

          <div className="management-count">
            {filteredVenues.length}{" "}
            {filteredVenues.length === 1
              ? "Venue"
              : "Venues"}
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="management-alert management-alert-error">
            {error}
          </div>
        )}

        {success && (
          <div className="management-alert management-alert-success">
            {success}
          </div>
        )}

        {/* Form */}
        <section className="management-card">
          <div className="management-card-header">
            <div>
              <p className="management-eyebrow">
                {editingId
                  ? "EDIT VENUE"
                  : "ADD VENUE"}
              </p>

              <h2>
                {editingId
                  ? "Edit Venue"
                  : "Create Venue"}
              </h2>
            </div>
          </div>

          <form
            className="venue-form"
            onSubmit={handleSubmit}
          >
            <div className="venue-form-grid">
              <div className="management-field">
                <label htmlFor="venue-name">
                  Venue Name
                </label>

                <input
                  id="venue-name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Laugh Factory Delhi"
                  maxLength={150}
                  disabled={saving}
                />
              </div>

              <div className="management-field">
                <label htmlFor="venue-city">
                  City
                </label>

                <select
                  id="venue-city"
                  name="city_id"
                  value={form.city_id}
                  onChange={handleChange}
                  disabled={saving}
                >
                  <option value="">
                    Select a city
                  </option>

                  {cities.map((city) => (
                    <option
                      key={city.id}
                      value={city.id}
                    >
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="management-field venue-address-field">
                <label htmlFor="venue-address">
                  Address
                </label>

                <input
                  id="venue-address"
                  name="address"
                  type="text"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Enter venue address"
                  maxLength={300}
                  disabled={saving}
                />
              </div>

              <div className="management-field venue-description-field">
                <label htmlFor="venue-description">
                  Description
                </label>

                <textarea
                  id="venue-description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Optional venue description"
                  rows={4}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="venue-form-actions">
              <button
                type="submit"
                className="primary-management-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save Changes"
                    : "Create Venue"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="secondary-management-button"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Venue list */}
        <section className="management-card">
          <div className="management-card-header venue-list-header">
            <div>
              <p className="management-eyebrow">
                VENUES
              </p>

              <h2>All Venues</h2>
            </div>

            <select
              className="city-filter"
              value={selectedCity}
              onChange={(event) =>
                setSelectedCity(event.target.value)
              }
            >
              <option value="">
                All Cities
              </option>

              {cities.map((city) => (
                <option
                  key={city.id}
                  value={city.id}
                >
                  {city.name}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="management-empty">
              <span>Loading venues...</span>
            </div>
          ) : filteredVenues.length === 0 ? (
            <div className="management-empty">
              <div className="management-empty-icon">
                🏟️
              </div>

              <h3>No venues found</h3>

              <p>
                Create a venue or select another city.
              </p>
            </div>
          ) : (
            <div className="venue-list">
              {filteredVenues.map((venue) => (
                <article
                  className="venue-row"
                  key={venue.id}
                >
                  <div className="venue-info">
                    <div className="venue-icon">
                      🏟️
                    </div>

                    <div>
                      <h3>{venue.name}</h3>

                      <div className="venue-meta">
                        <span>
                          📍{" "}
                          {getCityName(venue.city_id)}
                        </span>

                        <span>
                          {venue.address}
                        </span>
                      </div>

                      {venue.description && (
                        <p>
                          {venue.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="venue-actions">
                    <button
                      type="button"
                      className="secondary-management-button"
                      onClick={() =>
                        startEditing(venue)
                      }
                      disabled={saving}
                    >
                      Edit
                    </button>
                    <button
                      className="secondary-button"
                      onClick={() => navigate(`/admin/venues/${venue.id}/seats`)}
                    >
                      Manage Seats
                    </button>

                    <button
                      type="button"
                      className="danger-management-button"
                      onClick={() =>
                        handleDelete(venue)
                      }
                      disabled={saving}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

export default AdminVenues;