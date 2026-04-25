import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/AuthPage.css";
import arrowBtn from "../DashBoard-icon/right-arrow.svg";

const API_URL = "http://localhost:3000";

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location.state && location.state.mode) {
      setMode(location.state.mode);
    }
  }, [location.state]);

  function handleBack() {
    navigate(-1);
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Помилка входу");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/dashboard");
    } catch (err) {
      setError("Не вдалось підключитись до сервера");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError("");

    if (password !== passwordRepeat) {
      setError("Паролі не співпадають");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Помилка реєстрації");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/dashboard");
    } catch (err) {
      setError("Не вдалось підключитись до сервера");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-shell">
        <button type="button" className="auth-back" onClick={handleBack}>
          <img src={arrowBtn} alt="" className="auth-back-icon" />
          <span>Назад</span>
        </button>

        <div className="auth-layout">
          <aside className="auth-side">
            <div className="auth-side-badge">Travel access</div>

            <h1 className="auth-side-title">
              {mode === "login"
                ? "Знову в дорогу?"
                : "Створи акаунт і плануй подорожі легко"}
            </h1>

            <p className="auth-side-text">
              Увійди в акаунт, щоб переглядати тури, зберігати напрямки та
              швидше оформлювати бронювання.
            </p>

            <div className="auth-side-cards">
              <article className="auth-info-card">
                <strong>Швидкий доступ</strong>
                <span>Збережені маршрути, заявки та вибрані напрямки в одному місці.</span>
              </article>

              <article className="auth-info-card">
                <strong>Зручне бронювання</strong>
                <span>Менше зайвих кроків, більше уваги самій подорожі.</span>
              </article>

              <article className="auth-info-card">
                <strong>Підтримка 24/7</strong>
                <span>Залишайся на зв’язку до, під час і після поїздки.</span>
              </article>
            </div>

            <div className="auth-side-stats">
              <div className="auth-stat">
                <strong>40+</strong>
                <span>напрямків</span>
              </div>
              <div className="auth-stat">
                <strong>250+</strong>
                <span>турів</span>
              </div>
              <div className="auth-stat">
                <strong>24/7</strong>
                <span>підтримка</span>
              </div>
            </div>
          </aside>

          <div className="auth-card">
            <div className="auth-card-top">
              <p className="auth-label">Туристичний акаунт</p>
              <h2>{mode === "login" ? "Вхід до акаунту" : "Створення акаунту"}</h2>
              <p className="auth-subtitle">
                {mode === "login"
                  ? "Увійди, щоб повернутись до своїх подорожей."
                  : "Заповни кілька полів і починай планувати відпочинок."}
              </p>
            </div>

            <div className={`auth-switch ${mode === "signup" ? "is-register" : ""}`}>
              <span className="auth-switch-indicator" />
              <button
                type="button"
                className={`auth-switch-btn ${mode === "login" ? "is-active" : ""}`}
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
              >
                Log In
              </button>
              <button
                type="button"
                className={`auth-switch-btn ${mode === "signup" ? "is-active" : ""}`}
                onClick={() => {
                  setMode("signup");
                  setError("");
                }}
              >
                Sign Up
              </button>
            </div>

            {error && <p className="auth-error">{error}</p>}

            {mode === "login" ? (
              <form className="auth-form" onSubmit={handleLogin}>
                <div className="auth-field">
                  <label htmlFor="login-email">Email</label>
                  <input
                    id="login-email"
                    type="email"
                    placeholder="name@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="auth-field">
                  <label htmlFor="login-password">Пароль</label>
                  <input
                    id="login-password"
                    type="password"
                    placeholder="Введи пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="auth-row">
                  <label className="auth-check">
                    <input type="checkbox" />
                    <span>Запам’ятати мене</span>
                  </label>

                  <button type="button" className="auth-link-btn">
                    Забув пароль?
                  </button>
                </div>

                <button type="submit" className="auth-submit" disabled={loading}>
                  {loading ? "Завантаження..." : "Увійти"}
                </button>
              </form>
            ) : (
              <form className="auth-form" onSubmit={handleRegister}>
                <div className="auth-field">
                  <label htmlFor="register-name">Ім’я</label>
                  <input
                    id="register-name"
                    type="text"
                    placeholder="Введи своє ім’я"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="auth-field">
                  <label htmlFor="register-email">Email</label>
                  <input
                    id="register-email"
                    type="email"
                    placeholder="name@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="auth-field">
                  <label htmlFor="register-password">Пароль</label>
                  <input
                    id="register-password"
                    type="password"
                    placeholder="Створи пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="auth-field">
                  <label htmlFor="register-password-repeat">Підтверди пароль</label>
                  <input
                    id="register-password-repeat"
                    type="password"
                    placeholder="Повтори пароль"
                    value={passwordRepeat}
                    onChange={(e) => setPasswordRepeat(e.target.value)}
                    required
                  />
                </div>

                <label className="auth-check auth-check-wide">
                  <input type="checkbox" required />
                  <span>Я погоджуюсь з умовами сервісу та політикою конфіденційності</span>
                </label>

                <button type="submit" className="auth-submit" disabled={loading}>
                  {loading ? "Завантаження..." : "Створити акаунт"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}