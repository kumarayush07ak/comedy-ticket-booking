import { useEffect, useState } from "react";
import {
  getCities,
  createCity,
  updateCity,
  deleteCity,
} from "../api/cities";

function AdminCities() {
  const [cities, setCities] = useState([]);
  const [cityName, setCityName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadCities() {
    try {
      setLoading(true);
      setError("");

      const data = await getCities();

      setCities(data);
    } catch (err) {
      console.error("Failed to load cities:", err);
      setError("Unable to load cities.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCities();
  }, []);

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  async function handleCreate(event) {
    event.preventDefault();

    clearMessages();

    const name = cityName.trim();

    if (name.length < 2) {
      setError("City name must contain at least 2 characters.");
      return;
    }

    try {
      setSaving(true);

      const newCity = await createCity(name);

      setCities((current) => [...current, newCity]);
      setCityName("");

      setSuccess(`City "${newCity.name}" created successfully.`);
    } catch (err) {
      console.error("Failed to create city:", err);

      if (err.response?.status === 409) {
        setError("A city with this name already exists.");
      } else if (err.response?.status === 401) {
        setError("Authentication required.");
      } else if (err.response?.status === 403) {
        setError("Admin access required.");
      } else {
        setError(
          err.response?.data?.detail ||
            "Unable to create city."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  function startEditing(city) {
    clearMessages();

    setEditingId(city.id);
    setEditingName(city.name);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditingName("");
  }

  async function handleUpdate(cityId) {
    clearMessages();

    const name = editingName.trim();

    if (name.length < 2) {
      setError("City name must contain at least 2 characters.");
      return;
    }

    try {
      setSaving(true);

      const updatedCity = await updateCity(cityId, name);

      setCities((current) =>
        current.map((city) =>
          city.id === cityId ? updatedCity : city
        )
      );

      cancelEditing();

      setSuccess(
        `City "${updatedCity.name}" updated successfully.`
      );
    } catch (err) {
      console.error("Failed to update city:", err);

      if (err.response?.status === 409) {
        setError("A city with this name already exists.");
      } else if (err.response?.status === 401) {
        setError("Authentication required.");
      } else if (err.response?.status === 403) {
        setError("Admin access required.");
      } else {
        setError(
          err.response?.data?.detail ||
            "Unable to update city."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(city) {
    clearMessages();

    const confirmed = window.confirm(
      `Delete "${city.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);

      await deleteCity(city.id);

      setCities((current) =>
        current.filter((item) => item.id !== city.id)
      );

      setSuccess(
        `City "${city.name}" deleted successfully.`
      );
    } catch (err) {
      console.error("Failed to delete city:", err);

      if (err.response?.status === 409) {
        setError(
          "This city cannot be deleted because it is being used by a venue."
        );
      } else if (err.response?.status === 401) {
        setError("Authentication required.");
      } else if (err.response?.status === 403) {
        setError("Admin access required.");
      } else {
        setError(
          err.response?.data?.detail ||
            "Unable to delete city."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="app">
      <section className="admin-management-page">
        <div className="management-header">
          <div>
            <p className="dashboard-label">ADMIN PANEL</p>

            <h1>City Management</h1>

            <p>
              Create and manage the cities where comedy events
              are hosted.
            </p>
          </div>

          <div className="management-count">
            {cities.length}{" "}
            {cities.length === 1 ? "City" : "Cities"}
          </div>
        </div>

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

        <section className="management-card">
          <div className="management-card-header">
            <div>
              <p className="management-eyebrow">
                ADD LOCATION
              </p>

              <h2>Create City</h2>
            </div>
          </div>

          <form
            className="management-form"
            onSubmit={handleCreate}
          >
            <input
              type="text"
              value={cityName}
              onChange={(event) =>
                setCityName(event.target.value)
              }
              placeholder="Enter city name"
              maxLength={100}
              disabled={saving}
            />

            <button
              type="submit"
              className="primary-management-button"
              disabled={saving}
            >
              {saving ? "Saving..." : "Add City"}
            </button>
          </form>
        </section>

        <section className="management-card">
          <div className="management-card-header">
            <div>
              <p className="management-eyebrow">
                LOCATIONS
              </p>

              <h2>All Cities</h2>
            </div>
          </div>

          {loading ? (
            <div className="management-empty">
              <span>Loading cities...</span>
            </div>
          ) : cities.length === 0 ? (
            <div className="management-empty">
              <div className="management-empty-icon">
                🏙️
              </div>

              <h3>No cities yet</h3>

              <p>
                Create your first city to start adding venues
                and events.
              </p>
            </div>
          ) : (
            <div className="city-list">
              {cities.map((city) => (
                <div
                  className="city-row"
                  key={city.id}
                >
                  {editingId === city.id ? (
                    <div className="city-edit-form">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(event) =>
                          setEditingName(
                            event.target.value
                          )
                        }
                        maxLength={100}
                        disabled={saving}
                      />

                      <button
                        type="button"
                        className="primary-management-button small"
                        onClick={() =>
                          handleUpdate(city.id)
                        }
                        disabled={saving}
                      >
                        Save
                      </button>

                      <button
                        type="button"
                        className="secondary-management-button"
                        onClick={cancelEditing}
                        disabled={saving}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="city-info">
                        <div className="city-icon">
                          🏙️
                        </div>

                        <div>
                          <h3>{city.name}</h3>

                          <p>
                            City ID: {city.id}
                          </p>
                        </div>
                      </div>

                      <div className="city-actions">
                        <button
                          type="button"
                          className="secondary-management-button"
                          onClick={() =>
                            startEditing(city)
                          }
                          disabled={saving}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="danger-management-button"
                          onClick={() =>
                            handleDelete(city)
                          }
                          disabled={saving}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

export default AdminCities;