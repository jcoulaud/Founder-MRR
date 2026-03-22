import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import { LeaderboardProvider } from "./hooks/useLeaderboard";
import ErrorBoundary from "./components/ErrorBoundary";
import Leaderboard from "./pages/Leaderboard";
import FounderProfile from "./pages/FounderProfile";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <LeaderboardProvider>
          <Routes>
            <Route path="/" element={<Leaderboard />} />
            <Route path="/founder/:identifier" element={<FounderProfile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </LeaderboardProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
