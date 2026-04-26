import { useNavigate } from "react-router-dom";

export default function MainPage() {
  const navigate = useNavigate();

  const destinations = [
    {
      title: "Carpathians",
      text: "Mountains, fresh air, cozy cottages and trails for active outdoor adventures.",
    },
    {
      title: "Italy",
      text: "Sea, architecture, the atmosphere of old cities and authentic Mediterranean cuisine.",
    },
    {
      title: "Bali",
      text: "Tropical relaxation, warm ocean, lush landscapes and a peaceful pace of life.",
    },
  ];

  const benefits = [
    {
      title: "Ready-made tours",
      text: "We handle routes, accommodation and flights — all in one package.",
    },
    {
      title: "Easy planning",
      text: "Simple booking conditions and a clear trip structure with no hassle.",
    },
    {
      title: "24/7 support",
      text: "We help before the trip, during the journey and after you return.",
    },
  ];

  function handleLogin() {
    navigate("/auth", { state: { mode: "login" } });
  }

  function handleSignUp() {
    navigate("/auth", { state: { mode: "signup" } });
  }

  function handleFindTour() {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/tours");
    } else {
      navigate("/auth", { state: { mode: "login" } });
    }
  }

  return (
    <main className="main-page">
      <section className="hero">
        <header className="header container">
          <div className="logo">TravelFlow</div>

          <nav className="nav">
            <a href="#destinations">Destinations</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
          </nav>

          <div className="header-actions">
            <button className="btn btn-secondary" onClick={handleLogin}>
              Login
            </button>
            <button className="btn btn-primary" onClick={handleSignUp}>
              Sign Up
            </button>
          </div>
        </header>

        <div className="hero-content container">
          <div className="hero-text">
            <p className="hero-badge">Travel agency</p>
            <h1>Trips you'll want to remember for a long time</h1>
            <p className="hero-description">
              Discover new cities, mountains, the sea and unforgettable experiences.
              We'll help you find a journey that's truly right for you.
            </p>

            <div className="hero-buttons">
              <button className="btn btn-primary" onClick={handleFindTour}>
                Find a tour
              </button>
              <button className="btn btn-outline">Learn more</button>
            </div>

            <div className="hero-stats">
              <div className="stat-card">
                <strong>250+</strong>
                <span>successful tours</span>
              </div>
              <div className="stat-card">
                <strong>40+</strong>
                <span>destinations</span>
              </div>
              <div className="stat-card">
                <strong>24/7</strong>
                <span>support</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-card hero-card-main">
              <p>Best routes</p>
              <h3>Summer 2026</h3>
              <span>Sea, mountains, sightseeing and city breaks</span>
            </div>

            <div className="hero-card hero-card-small top">
              <strong>Discounts</strong>
              <span>up to -20% for early booking</span>
            </div>

            <div className="hero-card hero-card-small bottom">
              <strong>Comfort</strong>
              <span>Tours matched to your budget and travel style</span>
            </div>
          </div>
        </div>
      </section>

      <section className="benefits section container" id="about">
        <div className="section-heading">
          <p className="section-label">Why choose us</p>
          <h2>We make travel simpler and more enjoyable</h2>
        </div>

        <div className="benefits-grid">
          {benefits.map((item) => (
            <article className="info-card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="destinations section container" id="destinations">
        <div className="section-heading">
          <p className="section-label">Popular destinations</p>
          <h2>Pick a place you want to visit right now</h2>
        </div>

        <div className="destinations-grid">
          {destinations.map((place) => (
            <article className="destination-card" key={place.title}>
              <div className="destination-image" />
              <div className="destination-content">
                <h3>{place.title}</h3>
                <p>{place.text}</p>
                <button className="link-button">Explore</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="cta section container" id="contact">
        <div className="cta-box">
          <div>
            <p className="section-label">Ready for new experiences?</p>
            <h2>We'll find a trip that truly suits you</h2>
            <p className="cta-text">
              Tell us your budget, dates and preferences — we'll take care of the rest.
            </p>
          </div>

          <div className="cta-actions">
            <button className="btn btn-primary" onClick={handleFindTour}>
              Find a trip
            </button>
            <button className="btn btn-secondary" onClick={handleLogin}>
              Sign in
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}