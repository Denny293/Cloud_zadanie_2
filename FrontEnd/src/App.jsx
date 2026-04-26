import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./assets/styles/App.css";

import MainPage from "./assets/pages/MainPage";
import AuthPage from "./assets/pages/AuthPage";
import ToursPage from "./assets/pages/ToursPage";
import FavoritesPage from "./assets/pages/FavoritesPage";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/auth" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/tours"
          element={
            <PrivateRoute>
              <ToursPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/favorites"
          element={
            <PrivateRoute>
              <FavoritesPage />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;