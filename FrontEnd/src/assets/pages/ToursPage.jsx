import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ToursPage.css";

const TOURS = [
  {
    id: 1,
    title: "Сонячна Барселона",
    country: "Іспанія",
    city: "Барселона",
    price: 520,
    nights: 7,
    month: "2026-06",
    rating: 4.8,
    tags: ["море", "місто", "екскурсії"],
    description:
      "Ідеальний варіант для тих, хто хоче поєднати пляжний відпочинок і красиву архітектуру.",
  },
  {
    id: 2,
    title: "Римські канікули",
    country: "Італія",
    city: "Рим",
    price: 610,
    nights: 6,
    month: "2026-07",
    rating: 4.9,
    tags: ["історія", "місто", "їжа"],
    description:
      "Старовинні вулиці, атмосферні кафе, музеї та насичена культурна програма.",
  },
  {
    id: 3,
    title: "Мальдівський релакс",
    country: "Мальдіви",
    city: "Мале",
    price: 1450,
    nights: 8,
    month: "2026-08",
    rating: 5.0,
    tags: ["океан", "люкс", "релакс"],
    description:
      "Теплий океан, білі пляжі та спокійний відпочинок для повного перезавантаження.",
  },
  {
    id: 4,
    title: "Гірські Карпати",
    country: "Україна",
    city: "Буковель",
    price: 280,
    nights: 5,
    month: "2026-06",
    rating: 4.7,
    tags: ["гори", "природа", "активність"],
    description:
      "Свіже повітря, неймовірні краєвиди та комфортний відпочинок серед природи.",
  },
  {
    id: 5,
    title: "Паризький вікенд",
    country: "Франція",
    city: "Париж",
    price: 690,
    nights: 4,
    month: "2026-09",
    rating: 4.8,
    tags: ["романтика", "місто", "архітектура"],
    description:
      "Швидка, красива і дуже атмосферна подорож для тих, хто любить великі міста.",
  },
  {
    id: 6,
    title: "Лісабон і океан",
    country: "Португалія",
    city: "Лісабон",
    price: 560,
    nights: 7,
    month: "2026-07",
    rating: 4.8,
    tags: ["океан", "місто", "сонце"],
    description:
      "Стильне місто, океанський бриз і чудовий вибір для літньої подорожі.",
  },
  {
    id: 7,
    title: "Афіни + море",
    country: "Греція",
    city: "Афіни",
    price: 480,
    nights: 7,
    month: "2026-06",
    rating: 4.6,
    tags: ["море", "історія", "сонце"],
    description:
      "Гарний баланс між пляжним відпочинком, античною історією та легкою атмосферою.",
  },
];

function getSavedUser() {
  try {
    const rawUser = localStorage.getItem("user");
    if (!rawUser) return null;
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
}

export default function ToursPage() {
  const navigate = useNavigate();
  const savedUser = getSavedUser();

  const [favorites, setFavorites] = useState([]);
  const [prompt, setPrompt] = useState("Хочу поїхати в Іспанію на 7 днів");
  const [submittedPrompt, setSubmittedPrompt] = useState(
    "Хочу поїхати в Іспанію на 7 днів"
  );

  const [destination, setDestination] = useState("all");
  const [date, setDate] = useState("");
  const [price, setPrice] = useState("all");
  const [duration, setDuration] = useState("all");

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  }

  function toggleFavorite(id) {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function handleSearch(e) {
    e.preventDefault();
    setSubmittedPrompt(prompt.trim() || "Підбери мені тур");
  }

  const recommendations = useMemo(() => {
    let result = [...TOURS];

    const query = submittedPrompt.toLowerCase().trim();

    if (query) {
      result = result.filter((tour) => {
        const text = `
          ${tour.title}
          ${tour.country}
          ${tour.city}
          ${tour.description}
          ${tour.tags.join(" ")}
        `
          .toLowerCase()
          .trim();

        return text.includes(query.split(" ")[0]) || text.includes(query);
      });
    }

    if (destination !== "all") {
      result = result.filter((tour) => tour.country === destination);
    }

    if (date) {
      result = result.filter((tour) => tour.month === date);
    }

    if (price !== "all") {
      if (price === "cheap") result = result.filter((tour) => tour.price < 400);
      if (price === "mid")
        result = result.filter((tour) => tour.price >= 400 && tour.price <= 700);
      if (price === "high") result = result.filter((tour) => tour.price > 700);
    }

    if (duration !== "all") {
      if (duration === "short") result = result.filter((tour) => tour.nights <= 4);
      if (duration === "week")
        result = result.filter((tour) => tour.nights >= 5 && tour.nights <= 7);
      if (duration === "long") result = result.filter((tour) => tour.nights >= 8);
    }

    if (result.length === 0) {
      result = [...TOURS];
    }

    return result.slice(0, 5);
  }, [submittedPrompt, destination, date, price, duration]);

  const email = savedUser?.email || "guest@gmail.com";

  return (
    <section className="tours-page">
      <div className="tours-container">
        <header className="tours-navbar">
          <div className="tours-logo" onClick={() => navigate("/")}>
            TravelFlow
          </div>

          <div className="tours-navbar-actions">
            <button className="nav-icon-btn" type="button">
              ♡
              <span>{favorites.length}</span>
            </button>

            <div className="user-pill">
              <span className="user-dot" />
              <span>{email}</span>
            </div>

            <button className="logout-btn" type="button" onClick={handleLogout}>
              Вийти
            </button>
          </div>
        </header>

        <section className="search-section">
          <div className="search-top">
            <p className="section-badge">AI-пошук турів</p>
            <h1>Знайди подорож під свій запит</h1>
            <p className="section-text">
              Напиши, куди хочеш поїхати, а система покаже кілька готових
              рекомендацій з урахуванням фільтрів.
            </p>
          </div>

          <form className="search-panel" onSubmit={handleSearch}>
            <div className="prompt-field">
              <label htmlFor="prompt">Що ти шукаєш?</label>
              <input
                id="prompt"
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Наприклад: хочу в Іспанію біля моря на 7 днів"
              />
            </div>

            <div className="filters-grid">
              <div className="filter-field">
                <label htmlFor="destination">Куди</label>
                <select
                  id="destination"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                >
                  <option value="all">Будь-який напрямок</option>
                  <option value="Іспанія">Іспанія</option>
                  <option value="Італія">Італія</option>
                  <option value="Греція">Греція</option>
                  <option value="Франція">Франція</option>
                  <option value="Португалія">Португалія</option>
                  <option value="Україна">Україна</option>
                  <option value="Мальдіви">Мальдіви</option>
                </select>
              </div>

              <div className="filter-field">
                <label htmlFor="date">Дата</label>
                <input
                  id="date"
                  type="month"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="filter-field">
                <label htmlFor="price">Ціна</label>
                <select
                  id="price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                >
                  <option value="all">Будь-яка</option>
                  <option value="cheap">До 400€</option>
                  <option value="mid">400€ – 700€</option>
                  <option value="high">700€+</option>
                </select>
              </div>

              <div className="filter-field">
                <label htmlFor="duration">Тривалість</label>
                <select
                  id="duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                >
                  <option value="all">Будь-яка</option>
                  <option value="short">До 4 днів</option>
                  <option value="week">5–7 днів</option>
                  <option value="long">8+ днів</option>
                </select>
              </div>
            </div>

            <button className="search-btn" type="submit">
              Шукати подорож
            </button>
          </form>
        </section>

        <section className="llm-preview">
          <div className="bubble assistant-bubble">
            Ось хороші варіанти, які я для тебе підібрав
          </div>

          <div className="bubble user-bubble">{submittedPrompt}</div>
        </section>

        <section className="results-section">
          <div className="results-head">
            <div>
              <p className="section-badge">Результати</p>
              <h2>5 рекомендованих турів</h2>
            </div>

            <p className="results-caption">
              Відповідь LLM можна буде пізніше підставити сюди з бекенду.
            </p>
          </div>

          <div className="results-grid">
            {recommendations.map((tour) => {
              const isFavorite = favorites.includes(tour.id);

              return (
                <article className="tour-card" key={tour.id}>
                  <div className="tour-card-image" />

                  <div className="tour-card-content">
                    <div className="tour-card-top">
                      <div>
                        <p className="tour-location">
                          {tour.country} · {tour.city}
                        </p>
                        <h3>{tour.title}</h3>
                      </div>

                      <button
                        type="button"
                        className={`tour-favorite ${isFavorite ? "is-active" : ""}`}
                        onClick={() => toggleFavorite(tour.id)}
                      >
                        {isFavorite ? "♥" : "♡"}
                      </button>
                    </div>

                    <p className="tour-description">{tour.description}</p>

                    <div className="tour-tags">
                      {tour.tags.map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>

                    <div className="tour-meta">
                      <div>
                        <strong>{tour.price}€</strong>
                        <span>за людину</span>
                      </div>

                      <div>
                        <strong>{tour.nights} ночей</strong>
                        <span>{tour.month}</span>
                      </div>

                      <div>
                        <strong>{tour.rating}</strong>
                        <span>рейтинг</span>
                      </div>
                    </div>

                    <button className="tour-btn" type="button">
                      Переглянути тур
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