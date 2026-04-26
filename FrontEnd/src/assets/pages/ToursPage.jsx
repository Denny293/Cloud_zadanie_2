import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ToursPage.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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

  // AI search form state
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("");
  const [preferences, setPreferences] = useState("");

  // Results state
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  // Favorites state (trip IDs saved in DB)
  const [favoriteIds, setFavoriteIds] = useState(new Set());

  // On mount — load saved trips to know which are favorited
  useEffect(() => {
    fetchFavorites();
  }, []);

  async function fetchFavorites() {
    try {
      const res = await fetch(`${API_URL}/trips`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const favIds = new Set(
        data.filter((t) => t.favorites).map((t) => t.id)
      );
      setFavoriteIds(favIds);
    } catch {
      // silently ignore
    }
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

    // Build prompt from form fields
    const promptParts = [];
    if (destination) promptParts.push(`destination: ${destination}`);
    if (startDate) promptParts.push(`start date: ${startDate}`);
    if (endDate) promptParts.push(`end date: ${endDate}`);
    if (budget) promptParts.push(`budget: ${budget} EUR`);
    if (preferences) promptParts.push(`preferences: ${preferences}`);

    const prompt =
      promptParts.length > 0
        ? promptParts.join(", ")
        : "Find me interesting random trips";

    try {
      const res = await fetch(`${API_URL}/ai/generate-trip`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          prompt,
          preferences: {
            destination: destination || null,
            startDate: startDate || null,
            endDate: endDate || null,
            budget: budget ? Number(budget) : null,
            wishes: preferences || null,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "AI service error. Please try again.");
        return;
      }

      // Expect data.result to be array of trips or { trips: [] }
      const result = data.result;
      const tripList = Array.isArray(result)
        ? result
        : Array.isArray(result?.trips)
        ? result.trips
        : [];

      setTours(tripList);
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
          start: tour.start || "Unknown",
          destination: tour.destination,
          startDate: tour.startDate,
          finishDate: tour.finishDate,
          price: tour.price,
          description: tour.description || "",
          flightLink: tour.flightLink || null,
          stayLink: tour.stayLink || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Could not save trip.");
        return;
      }

      // Mark as favorite immediately after saving
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

  const email = savedUser
    ? `${savedUser.firstname} ${savedUser.lastname}`
    : "Guest";

  return (
    <section className="tours-page">
      <div className="tours-container">
        <header className="tours-navbar">
          <div className="tours-logo" onClick={() => navigate("/")}>
            TravelFlow
          </div>

          <div className="tours-navbar-actions">
            <button
              className="nav-icon-btn"
              type="button"
              onClick={() => navigate("/favorites")}
            >
              ♡ <span>Favorites</span>
            </button>

            <div className="user-pill">
              <span className="user-dot" />
              <span>{email}</span>
            </div>

            <button className="logout-btn" type="button" onClick={handleLogout}>
              Sign Out
            </button>
          </div>
        </header>

        {/* Search Section */}
        <section className="search-section">
          <div className="search-top">
            <p className="section-badge">AI-powered search</p>
            <h1>Find your perfect trip</h1>
            <p className="section-text">
              Tell us where you want to go — AI will suggest the 5 best options for you.
              Leave fields empty for random recommendations.
            </p>
          </div>

          <form className="search-panel" onSubmit={handleSearch}>
            <div className="filters-grid">
              <div className="filter-field">
                <label htmlFor="destination">Destination</label>
                <input
                  id="destination"
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Barcelona, Japan, anywhere..."
                />
              </div>

              <div className="filter-field">
                <label htmlFor="startDate">Start date</label>
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="filter-field">
                <label htmlFor="endDate">End date</label>
                <input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="filter-field">
                <label htmlFor="budget">Max budget (€)</label>
                <input
                  id="budget"
                  type="number"
                  min="0"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="e.g. 1000"
                />
              </div>
            </div>

            <div className="prompt-field">
              <label htmlFor="preferences">Wishes (optional)</label>
              <input
                id="preferences"
                type="text"
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                placeholder="e.g. beach, history, adventure, family-friendly..."
              />
            </div>

            <button className="search-btn" type="submit" disabled={loading}>
              {loading ? "Searching..." : "Find trips"}
            </button>
          </form>
        </section>

        {/* Results Section */}
        {searched && (
          <section className="results-section">
            <div className="results-head">
              <div>
                <p className="section-badge">Results</p>
                <h2>Top 5 recommended trips</h2>
              </div>
            </div>

            {error && (
              <div className="error-banner">
                <p>{error}</p>
              </div>
            )}

            {loading && (
              <div className="loading-state">
                <p>AI is searching for the best trips for you...</p>
              </div>
            )}

            {!loading && !error && tours.length === 0 && (
              <div className="empty-state">
                <p>No trips found. Try different search criteria.</p>
              </div>
            )}

            <div className="results-grid">
              {tours.map((tour, index) => (
                <article className="tour-card" key={index}>
                  <div className="tour-card-image" />

                  <div className="tour-card-content">
                    <div className="tour-card-top">
                      <div>
                        <p className="tour-location">{tour.destination}</p>
                        <h3>{tour.title || tour.destination}</h3>
                      </div>
                    </div>

                    <p className="tour-description">{tour.description}</p>

                    {tour.tags && (
                      <div className="tour-tags">
                        {tour.tags.map((tag) => (
                          <span key={tag}>{tag}</span>
                        ))}
                      </div>
                    )}

                    <div className="tour-meta">
                      {tour.price && (
                        <div>
                          <strong>{tour.price}€</strong>
                          <span>per person</span>
                        </div>
                      )}
                      {tour.startDate && (
                        <div>
                          <strong>{tour.startDate}</strong>
                          <span>start date</span>
                        </div>
                      )}
                      {tour.finishDate && (
                        <div>
                          <strong>{tour.finishDate}</strong>
                          <span>end date</span>
                        </div>
                      )}
                    </div>

                    <div className="tour-links">
                      {tour.flightLink && (
                        <a
                          href={tour.flightLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="tour-link-btn"
                        >
                          ✈ Flights
                        </a>
                      )}
                      {tour.stayLink && (
                        <a
                          href={tour.stayLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="tour-link-btn"
                        >
                          🏨 Hotels
                        </a>
                      )}
                    </div>

                    <button
                      className="tour-btn"
                      type="button"
                      onClick={() => handleSaveTrip(tour)}
                    >
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