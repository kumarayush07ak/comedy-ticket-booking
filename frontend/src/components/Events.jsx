import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getEvents } from "../api/events";
import { getCities } from "../api/cities";
import { getVenues } from "../api/venues";

function Events() {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [cities, setCities] = useState([]);
  const [venues, setVenues] = useState([]);

  const [search, setSearch] = useState("");
  const [cityId, setCityId] = useState("");
  const [eventFormat, setEventFormat] = useState("");
  const [eventDate, setEventDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [eventData, cityData, venueData] = await Promise.all([
        getEvents(),
        getCities(),
        getVenues(),
      ]);

      setEvents(eventData);
      setCities(cityData);
      setVenues(venueData);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Failed to load events."
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const selectedCity = cityId
        ? cities.find((city) => city.id === Number(cityId))
        : null;

      const venue = venues.find(
        (item) => item.id === event.venue_id
      );

      const matchesSearch =
        !search ||
        event.title
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        event.description
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||
        event.organizer_name
          ?.toLowerCase()
          .includes(search.toLowerCase());

      const matchesCity =
        !selectedCity ||
        venue?.city_id === selectedCity.id;

      const matchesFormat =
        !eventFormat ||
        event.event_format === eventFormat;

      const matchesDate =
        !eventDate ||
        event.event_date === eventDate;

      return (
        matchesSearch &&
        matchesCity &&
        matchesFormat &&
        matchesDate
      );
    });
  }, [
    events,
    cities,
    venues,
    search,
    cityId,
    eventFormat,
    eventDate,
  ]);

  function getVenueName(venueId) {
    const venue = venues.find(
      (item) => item.id === venueId
    );

    return venue?.name || "Venue";
  }

  function getCityName(venueId) {
    const venue = venues.find(
      (item) => item.id === venueId
    );

    const city = cities.find(
      (item) => item.id === venue?.city_id
    );

    return city?.name || "City";
  }

  function formatEventFormat(format) {
    return format
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function formatDate(dateString) {
    if (!dateString) return "";

    return new Date(`${dateString}T00:00:00`).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  }

  function formatTime(timeString) {
    if (!timeString) return "";

    const [hour, minute] = timeString.split(":");

    const date = new Date();
    date.setHours(Number(hour), Number(minute), 0, 0);

    return date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function clearFilters() {
    setSearch("");
    setCityId("");
    setEventFormat("");
    setEventDate("");
  }

  if (loading) {
    return (
      <main className="events-page">
        <div className="events-loading">
          <div className="loading-icon">🎭</div>
          <h2>Finding comedy shows...</h2>
          <p>Hang tight, we're loading the laughs.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="events-page">
      <section className="events-hero">
        <div>
          <span className="section-eyebrow">
            LAUGHTICKET EVENTS
          </span>

          <h1>Find Your Next Laugh</h1>

          <p>
            Discover standup, open mics, improv and comedy
            shows happening near you.
          </p>
        </div>
      </section>

      {error && (
        <div className="management-alert error-alert">
          {error}
        </div>
      )}

      <section className="event-filters">
        <div className="filter-search">
          <label>Search</label>

          <input
            type="text"
            placeholder="Search comedy events..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <div>
          <label>City</label>

          <select
            value={cityId}
            onChange={(event) =>
              setCityId(event.target.value)
            }
          >
            <option value="">All Cities</option>

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

        <div>
          <label>Format</label>

          <select
            value={eventFormat}
            onChange={(event) =>
              setEventFormat(event.target.value)
            }
          >
            <option value="">All Formats</option>
            <option value="STANDUP">Standup</option>
            <option value="OPEN_MIC">Open Mic</option>
            <option value="IMPROV">Improv</option>
            <option value="COMEDY_SHOW">
              Comedy Show
            </option>
          </select>
        </div>

        <div>
          <label>Date</label>

          <input
            type="date"
            value={eventDate}
            onChange={(event) =>
              setEventDate(event.target.value)
            }
          />
        </div>

        <button
          className="clear-filter-button"
          onClick={clearFilters}
        >
          Clear
        </button>
      </section>

      <section className="events-results">
        <div className="events-results-header">
          <div>
            <span className="section-eyebrow">
              DISCOVER
            </span>

            <h2>
              {filteredEvents.length}{" "}
              {filteredEvents.length === 1
                ? "Event"
                : "Events"}
            </h2>
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="events-empty">
            <div>🎭</div>

            <h3>No events found</h3>

            <p>
              Try changing your filters or search for
              something else.
            </p>

            <button
              className="primary-button"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="customer-event-grid">
            {filteredEvents.map((event) => (
              <article
                className="customer-event-card"
                key={event.id}
              >
                <div className="customer-event-poster">
                  {event.poster_url ? (
                    <img
                      src={event.poster_url}
                      alt={event.title}
                    />
                  ) : (
                    <div className="poster-placeholder">
                      <span>🎭</span>
                      <small>LaughTicket</small>
                    </div>
                  )}

                  <span
                    className={`customer-event-status ${event.status.toLowerCase()}`}
                  >
                    {event.status}
                  </span>
                </div>

                <div className="customer-event-body">
                  <span className="customer-event-format">
                    {formatEventFormat(
                      event.event_format
                    )}
                  </span>

                  <h3>{event.title}</h3>

                  {event.description && (
                    <p className="customer-event-description">
                      {event.description}
                    </p>
                  )}

                  <div className="customer-event-info">
                    <div>
                      <span>📅</span>

                      <div>
                        <small>Date</small>
                        <strong>
                          {formatDate(event.event_date)}
                        </strong>
                      </div>
                    </div>

                    <div>
                      <span>🕐</span>

                      <div>
                        <small>Time</small>
                        <strong>
                          {formatTime(event.start_time)}
                        </strong>
                      </div>
                    </div>

                    <div>
                      <span>📍</span>

                      <div>
                        <small>Venue</small>
                        <strong>
                          {getVenueName(event.venue_id)}
                        </strong>

                        <small>
                          {getCityName(event.venue_id)}
                        </small>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="customer-event-footer">
                  <div>
                    <small>Starting from</small>

                    <strong>
                      ₹
                      {Number(event.ticket_price).toFixed(
                        0
                      )}
                    </strong>
                  </div>

                  <button
                    className="event-view-button"
                    onClick={() =>
                      navigate(`/events/${event.id}`)
                    }
                  >
                    View Event →
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default Events;