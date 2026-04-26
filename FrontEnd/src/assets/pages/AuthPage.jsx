import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/AuthPage.css";
import arrowBtn from "../DashBoard-icon/right-arrow.svg";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");

  const [email, setEmail] = useState("");
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
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
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login error");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/tours");
    } catch (err) {
      setError("Could not connect to server");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError("");

    if (password !== passwordRepeat) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstname, lastname, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Registration error");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/tours");
    } catch (err) {
      setError("Could not connect to server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-shell">
        <button type="button" className="auth-back" onClick={handleBack}>
          <img src={arrowBtn} alt="" className="auth-back-icon" />
          <span>Back</span>
        </button>

        <div className="auth-layout">
          <aside className="auth-side">
            <div className="auth-side-badge">Travel access</div>

            <h1 className="auth-side-title">
              {mode === "login"
                ? "Back on the road?"
                : "Create an account and plan trips easily"}
            </h1>

            <p className="auth-side-text">
              Sign in to browse tours, save destinations and book faster.
            </p>

            <div className="auth-side-cards">
              <article className="auth-info-card">
                <strong>Quick access</strong>
                <span>Saved routes, bookings and favourite destinations in one place.</span>
              </article>

              <article className="auth-info-card">
                <strong>Easy booking</strong>
                <span>Fewer steps, more focus on the journey itself.</span>
              </article>

              <article className="auth-info-card">
                <strong>24/7 support</strong>
                <span>We're here before, during and after your trip.</span>
              </article>
            </div>

            <div className="auth-side-stats">
              <div className="auth-stat">
                <strong>40+</strong>
                <span>destinations</span>
              </div>
              <div className="auth-stat">
                <strong>250+</strong>
                <span>tours</span>
              </div>
              <div className="auth-stat">
                <strong>24/7</strong>
                <span>support</span>
              </div>
            </div>
          </aside>

          <div className="auth-card">
            <div className="auth-card-top">
              <p className="auth-label">Travel account</p>
              <h2>{mode === "login" ? "Sign in" : "Create account"}</h2>
              <p className="auth-subtitle">
                {mode === "login"
                  ? "Sign in to get back to your trips."
                  : "Fill in a few fields and start planning your holiday."}
              </p>
            </div>

            <div className={`auth-switch ${mode === "signup" ? "is-register" : ""}`}>
              <span className="auth-switch-indicator" />
              <button
                type="button"
                className={`auth-switch-btn ${mode === "login" ? "is-active" : ""}`}
                onClick={() => { setMode("login"); setError(""); }}
              >
                Log In
              </button>
              <button
                type="button"
                className={`auth-switch-btn ${mode === "signup" ? "is-active" : ""}`}
                onClick={() => { setMode("signup"); setError(""); }}
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
                  <label htmlFor="login-password">Password</label>
                  <input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="auth-row">
                  <label className="auth-check">
                    <input type="checkbox" />
                    <span>Remember me</span>
                  </label>

                  <button type="button" className="auth-link-btn">
                    Forgot password?
                  </button>
                </div>

                <button type="submit" className="auth-submit" disabled={loading}>
                  {loading ? "Loading..." : "Sign In"}
                </button>
              </form>
            ) : (
              <form className="auth-form" onSubmit={handleRegister}>
                <div className="auth-field">
                  <label htmlFor="register-firstname">First name</label>
                  <input
                    id="register-firstname"
                    type="text"
                    placeholder="Enter your first name"
                    value={firstname}
                    onChange={(e) => setFirstname(e.target.value)}
                    required
                  />
                </div>

                <div className="auth-field">
                  <label htmlFor="register-lastname">Last name</label>
                  <input
                    id="register-lastname"
                    type="text"
                    placeholder="Enter your last name"
                    value={lastname}
                    onChange={(e) => setLastname(e.target.value)}
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
                  <label htmlFor="register-password">Password</label>
                  <input
                    id="register-password"
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="auth-field">
                  <label htmlFor="register-password-repeat">Confirm password</label>
                  <input
                    id="register-password-repeat"
                    type="password"
                    placeholder="Repeat your password"
                    value={passwordRepeat}
                    onChange={(e) => setPasswordRepeat(e.target.value)}
                    required
                  />
                </div>

                <label className="auth-check auth-check-wide">
                  <input type="checkbox" required />
                  <span>I agree to the terms of service and privacy policy</span>
                </label>

                <button type="submit" className="auth-submit" disabled={loading}>
                  {loading ? "Loading..." : "Create account"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}