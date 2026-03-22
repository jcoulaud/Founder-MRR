import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { LeaderboardData, FounderEntry } from "@foundermrr/shared";

interface LeaderboardState {
  data: FounderEntry[];
  lastSyncedAt: string | null;
  totalFounders: number;
  totalStartups: number;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

const LeaderboardContext = createContext<LeaderboardState | null>(null);

export function LeaderboardProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<FounderEntry[]>([]);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [totalFounders, setTotalFounders] = useState(0);
  const [totalStartups, setTotalStartups] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/leaderboard");
      if (res.status === 503) {
        setError("sync_pending");
        return;
      }
      if (!res.ok) {
        setError(`Failed to load (${res.status})`);
        return;
      }
      const json: LeaderboardData = await res.json();
      setData(json.data);
      setLastSyncedAt(json.lastSyncedAt);
      setTotalFounders(json.totalFounders);
      setTotalStartups(json.totalStartups);
    } catch {
      setError("Network error — unable to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <LeaderboardContext.Provider
      value={{ data, lastSyncedAt, totalFounders, totalStartups, loading, error, retry: fetchData }}
    >
      {children}
    </LeaderboardContext.Provider>
  );
}

export function useLeaderboard() {
  const ctx = useContext(LeaderboardContext);
  if (!ctx) throw new Error("useLeaderboard must be inside LeaderboardProvider");
  return ctx;
}
