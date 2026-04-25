import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./assets/styles/App.css";

import MainPage from "./assets/pages/MainPage";
import AuthPage from "./assets/pages/AuthPage";
import ToursPage from "./assets/pages/ToursPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/AuthPage" element={<AuthPage />} />
        <Route path="/tours" element={<ToursPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;