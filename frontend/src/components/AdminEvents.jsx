import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getCities } from "../api/cities";
import { getVenuesByCity } from "../api/venues";
import {
  getEvents,
  createEvent,
  cancelEvent,
} from "../api/events";

function AdminEvents() {
  const navigate = useNavigate();

  const [cities, setCities] = useState([]);
  const [venues, setVenues] = useState([]);
  const [events, setEvents] = useState([]);

  const [selectedCity, setSelectedCity] = useState("");
  const [selectedVenue, setSelectedVenue] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cancellingEventId, setCancellingEventId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    event_format: "STANDUP",
    venue_id: "",
    event_date: "",
    start_time: "",
    end_time: "",
    ticket_price: "",
    poster_url: "",
    organizer_name: "",
    organizer_email: "",
    organizer_phone: "",
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      setLoading(true);
      setError("");

      const [cityData, eventData] = await Promise.all([
        getCities(),
        getEvents(),
      ]);

      setCities(cityData);
      setEvents(eventData);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Failed to load event management data."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCityChange(event) {
    const cityId = event.target.value;

    setSelectedCity(cityId);
    setSelectedVenue("");

    setForm((current) => ({
      ...current,
      venue_id: "",
    }));

    if (!cityId) {
      setVenues([]);
      return;
    }

    try {
      const venueData = await getVenuesByCity(cityId);
      setVenues(venueData);
    } catch (err) {
      console.error(err);

      setVenues([]);

      setError(
        err.response?.data?.detail ||
          "Failed to load venues."
      );
    }
  }

  function handleVenueChange(event) {
    const venueId = event.target.value;

    setSelectedVenue(venueId);

    setForm((current) => ({
      ...current,
      venue_id: venueId,
    }));
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.venue_id) {
      setError("Please select a venue.");
      return;
    }

    if (form.end_time <= form.start_time) {
      setError("End time must be after start time.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      event_format: form.event_format,
      venue_id: Number(form.venue_id),
      event_date: form.event_date,
      start_time: form.start_time,
      end_time: form.end_time,
      ticket_price: Number(form.ticket_price),
      poster_url: form.poster_url.trim() || null,
      organizer_name: form.organizer_name.trim(),
      organizer_email: form.organizer_email.trim() || null,
      organizer_phone: form.organizer_phone.trim() || null,
    };

    try {
      setSaving(true);

      const createdEvent = await createEvent(payload);

      setEvents((current) => [
        createdEvent,
        ...current,
      ]);

      setSuccess("Event created successfully.");

      setForm({
        title: "",
        description: "",
        event_format: "STANDUP",
        venue_id: "",
        event_date: "",
        start_time: "",
        end_time: "",
        ticket_price: "",
        poster_url: "",
        organizer_name: "",
        organizer_email: "",
        organizer_phone: "",
      });

      setSelectedVenue("");
    } catch (err) {
      console.error(err);

      if (err.response?.status === 400) {
        setError(
          err.response?.data?.detail ||
            "Invalid event information."
        );
      } else if (err.response?.status === 401) {
        setError(
          "Your session has expired. Please login again."
        );
      } else if (err.response?.status === 403) {
        setError(
          "Only an admin can create events."
        );
      } else if (err.response?.status === 404) {
        setError(
          err.response?.data?.detail ||
            "Venue not found."
        );
      } else {
        setError(
          err.response?.data?.detail ||
            "Failed to create event."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleCancelEvent(eventId, eventTitle) {
    const confirmed = window.confirm(
      `Are you sure you want to cancel "${eventTitle}"?\n\n` +
        "This will cancel the event and process refunds " +
        "for confirmed bookings."
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");
      setCancellingEventId(eventId);

      await cancelEvent(eventId);

      setEvents((current) =>
        current.map((event) =>
          event.id === eventId
            ? {
                ...event,
                status: "CANCELLED",
              }
            : event
        )
      );

      setSuccess(
        `Event "${eventTitle}" has been cancelled successfully.`
      );
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Failed to cancel the event."
      );
    } finally {
      setCancellingEventId(null);
    }
  }

  function getVenueName(venueId) {
    const venue = venues.find(
      (item) => item.id === venueId
    );

    return venue?.name || `Venue #${venueId}`;
  }

  if (loading) {
    return (
      <main className="page-container">
        <div className="management-card">
          <p>Loading events...</p>
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
            onClick={() => navigate("/admin/dashboard")}
          >
            ← Dashboard
          </button>

          <h1>Event Management</h1>

          <p>
            Create comedy events and assign them to venues.
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
            <h2>Create Event</h2>

            <p>
              Create an event using an existing venue and
              seat layout.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="management-form-grid">
            <div className="form-group">
              <label>Event Title *</label>

              <input
                type="text"
                name="title"
                value={form.title}
                maxLength={200}
                required
                placeholder="Comedy Night Delhi"
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Event Format *</label>

              <select
                name="event_format"
                value={form.event_format}
                onChange={handleChange}
                required
              >
                <option value="STANDUP">
                  Standup
                </option>

                <option value="OPEN_MIC">
                  Open Mic
                </option>

                <option value="IMPROV">
                  Improv
                </option>

                <option value="COMEDY_SHOW">
                  Comedy Show
                </option>
              </select>
            </div>

            <div className="form-group">
              <label>City *</label>

              <select
                value={selectedCity}
                onChange={handleCityChange}
                required
              >
                <option value="">
                  Select City
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

            <div className="form-group">
              <label>Venue *</label>

              <select
                value={selectedVenue}
                onChange={handleVenueChange}
                disabled={!selectedCity}
                required
              >
                <option value="">
                  Select Venue
                </option>

                {venues.map((venue) => (
                  <option
                    key={venue.id}
                    value={venue.id}
                  >
                    {venue.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Event Date *</label>

              <input
                type="date"
                name="event_date"
                value={form.event_date}
                required
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Ticket Price *</label>

              <input
                type="number"
                name="ticket_price"
                min="1"
                step="0.01"
                value={form.ticket_price}
                required
                placeholder="499"
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Start Time *</label>

              <input
                type="time"
                name="start_time"
                value={form.start_time}
                required
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>End Time *</label>

              <input
                type="time"
                name="end_time"
                value={form.end_time}
                required
                onChange={handleChange}
              />
            </div>

            <div className="form-group full-width">
              <label>Description</label>

              <textarea
                name="description"
                value={form.description}
                rows="4"
                placeholder="Describe the comedy event..."
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Organizer Name *</label>

              <input
                type="text"
                name="organizer_name"
                value={form.organizer_name}
                maxLength={150}
                required
                placeholder="Comedy Events India"
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Organizer Email *</label>

              <input
                type="email"
                name="organizer_email"
                value={form.organizer_email}
                placeholder="organizer@example.com"
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Organizer Phone *</label>

              <input
                type="tel"
                name="organizer_phone"
                value={form.organizer_phone}
                placeholder="+91..."
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Poster URL</label>

              <input
                type="url"
                name="poster_url"
                value={form.poster_url}
                placeholder="https://..."
                onChange={handleChange}
              />
            </div>
          </div>

          <button
            type="submit"
            className="primary-button"
            disabled={saving}
          >
            {saving ? "Creating..." : "Create Event"}
          </button>
        </form>
      </section>

      <section className="events-section">
        <div className="events-section-header">
          <div>
            <span className="section-eyebrow">
              EVENT CATALOG
            </span>

            <h2>Existing Events</h2>

            <p>
              Manage and view the comedy events currently
              available on the platform.
            </p>
          </div>

          <div className="event-count">
            <strong>{events.length}</strong>
            <span>Events</span>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="event-empty-state">
            <div className="empty-icon">🎭</div>

            <h3>No events yet</h3>

            <p>
              Create your first comedy event using the form
              above.
            </p>
          </div>
        ) : (
          <div className="event-card-grid">
            {events.map((event) => (
              <article
                className="event-admin-card"
                key={event.id}
              >
                <div className="event-card-top">
                  <div className="event-card-icon">
                    🎭
                  </div>

                  <span
                    className={`event-status ${event.status.toLowerCase()}`}
                  >
                    {event.status}
                  </span>
                </div>

                <div className="event-card-content">
                  <span className="event-format">
                    {event.event_format.replace("_", " ")}
                  </span>

                  <h3>{event.title}</h3>

                  {event.description && (
                    <p className="event-description">
                      {event.description}
                    </p>
                  )}

                  <div className="event-details">
                    <div className="event-detail">
                      <span className="detail-icon">
                        📅
                      </span>

                      <div>
                        <small>Date</small>

                        <strong>
                          {event.event_date}
                        </strong>
                      </div>
                    </div>

                    <div className="event-detail">
                      <span className="detail-icon">
                        🕐
                      </span>

                      <div>
                        <small>Time</small>

                        <strong>
                          {event.start_time} –{" "}
                          {event.end_time}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="event-card-footer">
                  <div className="event-price">
                    <small>Ticket Price</small>

                    <strong>
                      ₹
                      {Number(event.ticket_price).toFixed(
                        0
                      )}
                    </strong>
                  </div>

                  <div className="event-card-actions">
                    <button
                      className="event-view-button"
                      onClick={() =>
                        navigate(`/events/${event.id}`)
                      }
                    >
                      View Event →
                    </button>

                    {event.status !== "CANCELLED" && (
                      <button
                        className="secondary-button"
                        onClick={() =>
                          handleCancelEvent(
                            event.id,
                            event.title
                          )
                        }
                        disabled={
                          cancellingEventId === event.id
                        }
                      >
                        {cancellingEventId === event.id
                          ? "Cancelling..."
                          : "Cancel Event"}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default AdminEvents;