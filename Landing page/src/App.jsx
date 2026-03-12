import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// ─── Theme ───
import { ThemeProvider } from "./context/ThemeContext";

// ─── Public module imports ───
import PublicLayout from "./modules/public/PublicLayout";
import Home from "./modules/public/pages/Home";
import Furniture from "./modules/public/pages/Furniture";
import Travel from "./modules/public/pages/Travel";
import Fashion from "./modules/public/pages/Fashion";
import Chef from "./modules/public/pages/Chef";
import NotFound from "./modules/public/pages/NotFound";
import Pexa from "./modules/public/pages/Pexa";
import Moemen from "./modules/public/pages/Moemen";
import Contact from "./modules/public/pages/Contact";

function App() {
  return (
    <ThemeProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          {/* ──────── PUBLIC WEBSITE ROUTES ──────── */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/furniture" element={<Furniture />} />
            <Route path="/travel" element={<Travel />} />
            <Route path="/fashion" element={<Fashion />} />
            <Route path="/chef" element={<Chef />} />
          </Route>

          {/* ──────── MANAGER PROFILE PAGES ──────── */}
          <Route path="/pexa" element={<Pexa />} />
          <Route path="/moemen" element={<Moemen />} />
          <Route path="/contact" element={<Contact />} />

          {/* ──────── CATCH-ALL 404 ──────── */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
