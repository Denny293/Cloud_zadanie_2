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

export default function ToursPage() {
  const navigate = useNavigate();
  const savedUser = getSavedUser();

  // Form state
  const [startCity, setStartCity] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Results state
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  // Favorites & photos
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [photos, setPhotos] = useState({});

  useEffect(() => { fetchFavorites(); }, []);

  useEffect(() => {
    tours.forEach((tour, index) => {
      fetchPhoto(tour.destination, index);
    });
  }, [tours]);

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
    try {
      const res = await fetch(`${API_URL}/trips`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setFavoriteIds(new Set(data.filter((t) => t.favorites).map((t) => t.id)));
    } catch {}
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  }

  async function handleSearch(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setSearched(true);
    setTours([]);
    setPhotos({});

    try {
      const res = await fetch(`${API_URL}/ai/generate-trip`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          prompt: "Find me travel trips",
          preferences: {
            startCity: startCity || null,
            destination: destination || null,
            startDate: startDate || null,
            endDate: endDate || null,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.message || "AI service error."); return; }
      setTours(Array.isArray(data.result) ? data.result : []);
    } catch {
      setError("Could not connect to server.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveTrip(tour) {
    try {
      const res = await fetch(`${API_URL}/trips`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          start: tour.start || startCity || "Unknown",
          destination: tour.destination,
          startDate: tour.startDate,
          finishDate: tour.finishDate,
          price: tour.price,
          description: tour.flightSummary || tour.description || "",
          flightLink: tour.flightLink || null,
          stayLink: tour.stayLink || null,
          weather: tour.weather || null,
          hotel: tour.hotel || null,
          highlights: tour.highlights
            ? tour.highlights.map(h =>
                typeof h === "string"
                  ? h.replace(/[\x00-\x1F\x7F]/g, " ").trim()
                  : (h.activity || "").replace(/[\x00-\x1F\x7F]/g, " ").trim()
              )
            : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) { alert(data.message || "Could not save trip."); return; }

      const newTripId = data.trip.id;
      await fetch(`${API_URL}/trips/${newTripId}/favorite`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      setFavoriteIds((prev) => new Set([...prev, newTripId]));
      alert("Trip saved to favorites!");
    } catch {
      alert("Could not connect to server.");
    }
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
            <button className="nav-icon-btn" type="button" onClick={() => navigate("/favorites")}>
              ♡ <span>Favorites</span>
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
            <p className="section-badge">AI-powered search</p>
            <h1>Find your perfect trip</h1>
            <p className="section-text">
              Tell us where you want to go — AI will find real flights and hotels for you.
            </p>
          </div>

          <form className="search-panel" onSubmit={handleSearch}>
            <div className="filters-grid">
              <div className="filter-field">
                <label htmlFor="startCity">From</label>
                <input
                  id="startCity"
                  type="text"
                  value={startCity}
                  onChange={(e) => setStartCity(e.target.value)}
                  placeholder="e.g. Vienna, Bratislava..."
                />
              </div>

              <div className="filter-field">
                <label htmlFor="destination">To</label>
                <input
                  id="destination"
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Barcelona, Rome..."
                />
              </div>

              <div className="filter-field">
                <label htmlFor="startDate">Departure date</label>
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="filter-field">
                <label htmlFor="endDate">Return date</label>
                <input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <button className="search-btn" type="submit" disabled={loading}>
              {loading ? "Searching..." : "Find trips"}
            </button>
          </form>
        </section>

        {searched && (
          <section className="results-section">
            <div className="results-head">
              <div>
                <p className="section-badge">Results</p>
                <h2>Top 5 recommended trips</h2>
              </div>
            </div>

            {error && <div className="error-banner"><p>{error}</p></div>}
            {loading && <div className="loading-state"><p>AI is searching for real flights and hotels...</p></div>}
            {!loading && !error && tours.length === 0 && (
              <div className="empty-state"><p>No trips found. Try different search criteria.</p></div>
            )}

            <div className="results-grid">
              {tours.map((tour, index) => (
                <article className="tour-card" key={index}>
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
                        <p className="tour-location">{tour.start} → {tour.destination}</p>
                        <h3>{tour.title}</h3>
                      </div>
                    </div>

                    {/* Flight info */}
                    {tour.flightSummary && tour.flightSummary !== "No flights found" && (
                      <div className="tour-flight-info">
                        <span>✈ {tour.flightSummary}</span>
                      </div>
                    )}

                    {/* Hotel info */}
                    {tour.hotel && (
                      <p className="tour-hotel">🏨 {tour.hotel}</p>
                    )}

                    {/* Hotel description (rating + price per night) */}
                    {tour.description && (
                      <p className="tour-hotel-desc">📍 {tour.description}</p>
                    )}

                    {/* Tags */}
                    {tour.flightSummary && tour.flightSummary !== "No flights found" && (
                      <div className="tour-tags">
                        <span>✈ {tour.flightSummary}</span>
                      </div>
                    )}

                    {/* Meta: price, dates */}
                    <div className="tour-meta">
                      {tour.price > 0 && (
                        <div>
                          <strong>{tour.price}€</strong>
                          <span>total est.</span>
                        </div>
                      )}
                      {tour.startDate && (
                        <div>
                          <strong>{tour.startDate}</strong>
                          <span>check-in</span>
                        </div>
                      )}
                      {tour.finishDate && (
                        <div>
                          <strong>{tour.finishDate}</strong>
                          <span>check-out</span>
                        </div>
                      )}
                    </div>

                    {/* Links */}
                    <div className="tour-links">
                      {tour.flightLink && (
                        <a href={tour.flightLink} target="_blank" rel="noopener noreferrer" className="tour-link-btn">
                          ✈ Flights
                        </a>
                      )}
                      {tour.stayLink && (
                        <a href={tour.stayLink} target="_blank" rel="noopener noreferrer" className="tour-link-btn">
                          🏨 Hotels
                        </a>
                      )}
                    </div>

                    <button className="tour-btn" type="button" onClick={() => handleSaveTrip(tour)}>
                      ♡ Save to Favorites
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </section>
  );
}