import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import { LeaderboardProvider } from "./hooks/useLeaderboard";
import Leaderboard from "./pages/Leaderboard";
import FounderProfile from "./pages/FounderProfile";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <LeaderboardProvider>
        <Routes>
          <Route path="/" element={<Leaderboard />} />
          <Route path="/founder/:identifier" element={<FounderProfile />} />
        </Routes>
      </LeaderboardProvider>
    </BrowserRouter>
  </StrictMode>
);
