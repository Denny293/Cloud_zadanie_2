import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ToursPage.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const PEXELS_KEY = import.meta.env.VITE_PEXELS_API_KEY;

function getToken() {
  return localStorage.getItem("token");
}

function getSavedUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function safeParseHighlights(highlights) {
  if (!highlights) return [];
  try {
    const parsed = JSON.parse(highlights);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function FavoritesPage() {
  const navigate = useNavigate();
  const savedUser = getSavedUser();

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [photos, setPhotos] = useState({});

  useEffect(() => { fetchFavorites(); }, []);

  useEffect(() => {
    trips.forEach((trip, index) => {
      fetchPhoto(trip.destination, index);
    });
  }, [trips]);

  async function fetchPhoto(query, index) {
    if (!query || !PEXELS_KEY) return;
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`,
        { headers: { Authorization: PEXELS_KEY } }
      );
      const data = await res.json();
      const url = data.photos?.[0]?.src?.landscape;
      if (url) setPhotos((prev) => ({ ...prev, [index]: url }));
    } catch {}
  }

  async function fetchFavorites() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/trips`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) { setError("Could not load favorites."); return; }
      const data = await res.json();
      setTrips(data.filter((t) => t.favorites));
    } catch {
      setError("Could not connect to server.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveFavorite(tripId) {
    try {
      await fetch(`${API_URL}/trips/${tripId}/favorite`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setTrips((prev) => prev.filter((t) => t.id !== tripId));
    } catch {
      alert("Could not remove from favorites.");
    }
  }

  async function handleDeleteTrip(tripId) {
    if (!confirm("Delete this trip permanently?")) return;
    try {
      const res = await fetch(`${API_URL}/trips/${tripId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) { alert("Could not delete trip."); return; }
      setTrips((prev) => prev.filter((t) => t.id !== tripId));
    } catch {
      alert("Could not connect to server.");
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  }

  const displayName = savedUser
    ? `${savedUser.firstname} ${savedUser.lastname}`
    : "Guest";

  return (
    <section className="tours-page">
      <div className="tours-container">
        <header className="tours-navbar">
          <div className="tours-logo" onClick={() => navigate("/")}>TravelFlow</div>
          <div className="tours-navbar-actions">
            <button className="nav-icon-btn" type="button" onClick={() => navigate("/tours")}>
              🔍 <span>Search trips</span>
            </button>
            <div className="user-pill">
              <span className="user-dot" />
              <span>{displayName}</span>
            </div>
            <button className="logout-btn" type="button" onClick={handleLogout}>Sign Out</button>
          </div>
        </header>

        <section className="search-section">
          <div className="search-top">
            <p className="section-badge">My collection</p>
            <h1>Saved trips</h1>
            <p className="section-text">
              All the trips you liked and saved — ready to book when you are.
            </p>
          </div>
        </section>

        <section className="results-section">
          {loading && <div className="loading-state"><p>Loading your saved trips...</p></div>}
          {error && <div className="error-banner"><p>{error}</p></div>}

          {!loading && !error && trips.length === 0 && (
            <div className="empty-state">
              <p>No saved trips yet.</p>
              <button
                className="search-btn"
                style={{ marginTop: "1rem", maxWidth: 220 }}
                onClick={() => navigate("/tours")}
              >
                Find a trip
              </button>
            </div>
          )}

          <div className="results-grid">
            {trips.map((trip, index) => {
              const highlights = safeParseHighlights(trip.highlights);

              return (
                <article className="tour-card" key={trip.id}>
                  <div
                    className="tour-card-image"
                    style={photos[index] ? {
                      backgroundImage: `url(${photos[index]})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    } : {}}
                  />

                  <div className="tour-card-content">
                    <div className="tour-card-top">
                      <div>
                        <p className="tour-location">{trip.start} → {trip.destination}</p>
                        <h3>{trip.destination}</h3>
                      </div>
                      <button
                        type="button"
                        className="tour-favorite is-active"
                        onClick={() => handleRemoveFavorite(trip.id)}
                        title="Remove from favorites"
                      >
                        ♥
                      </button>
                    </div>

                    {/* Flight info */}
                    {trip.description && (
                      <div className="tour-flight-info">
                        <span>✈ {trip.description}</span>
                      </div>
                    )}

                    {/* Hotel */}
                    {trip.hotel && (
                      <p className="tour-hotel">🏨 {trip.hotel}</p>
                    )}

                    {/* Hotel description / rating */}
                    {highlights.length > 0 && highlights[0] && (
                      <p className="tour-hotel-desc">📍 {highlights[0]}</p>
                    )}

                    {/* Meta */}
                    <div className="tour-meta">
                      <div>
                        <strong>{trip.price}€</strong>
                        <span>total est.</span>
                      </div>
                      <div>
                        <strong>{new Date(trip.startDate).toLocaleDateString("en-GB")}</strong>
                        <span>check-in</span>
                      </div>
                      <div>
                        <strong>{new Date(trip.finishDate).toLocaleDateString("en-GB")}</strong>
                        <span>check-out</span>
                      </div>
                    </div>

                    {/* Links */}
                    <div className="tour-links">
                      {trip.flightLink && (
                        <a href={trip.flightLink} target="_blank" rel="noopener noreferrer" className="tour-link-btn">
                          ✈ Flights
                        </a>
                      )}
                      {trip.stayLink && (
                        <a href={trip.stayLink} target="_blank" rel="noopener noreferrer" className="tour-link-btn">
                          🏨 Hotels
                        </a>
                      )}
                    </div>

                    <button
                      className="tour-btn tour-btn-danger"
                      type="button"
                      onClick={() => handleDeleteTrip(trip.id)}
                    >
                      🗑 Delete trip
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </section>
  );
}