import { useCallback, useMemo, useState } from "react";
import type { FounderEntry } from "@foundermrr/shared";
import { useLeaderboard } from "../hooks/useLeaderboard";
import SearchBar from "../components/SearchBar";
import CategoryFilter from "../components/CategoryFilter";
import RisingStars from "../components/RisingStars";
import LeaderboardTable from "../components/LeaderboardTable";

type SortKey = "revenue" | "mrr" | "growth" | "startups";

const PAGE_SIZE = 50;

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default function Leaderboard() {
  const { data, loading, error, retry, lastSyncedAt, totalFounders, totalStartups } = useLeaderboard();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("revenue");
  const [page, setPage] = useState(1);

  const handleSearch = useCallback((q: string) => {
    setSearch(q);
    setPage(1);
  }, []);

  const handleCategory = useCallback((cat: string | null) => {
    setCategory(cat);
    setPage(1);
  }, []);

  const handleSort = useCallback((key: SortKey) => {
    setSortKey(key);
    setPage(1);
  }, []);

  const filtered = useMemo(() => {
    let result = data;

    if (category) {
      result = result.filter((f) => f.categories.includes(category));
    }

    if (search.trim()) {
      const q = escapeRegex(search.trim().toLowerCase());
      result = result.filter((f) => {
        const handle = f.xHandle.toLowerCase();
        const startupNames = f.startups.map((s) => s.name.toLowerCase()).join(" ");
        return handle.includes(q) || startupNames.includes(q);
      });
    }

    const sorted = [...result];
    switch (sortKey) {
      case "revenue":
        sorted.sort((a, b) => b.totalRevenue30d - a.totalRevenue30d);
        break;
      case "mrr":
        sorted.sort((a, b) => b.totalMrr - a.totalMrr);
        break;
      case "growth":
        sorted.sort((a, b) => (b.avgGrowth30d ?? -Infinity) - (a.avgGrowth30d ?? -Infinity));
        break;
      case "startups":
        sorted.sort((a, b) => b.startupCount - a.startupCount);
        break;
    }

    return sorted;
  }, [data, category, search, sortKey]);

  const visible = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < filtered.length;

  const staleHours = lastSyncedAt
    ? Math.round((Date.now() - new Date(lastSyncedAt).getTime()) / 3600000)
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="font-display font-bold text-xl text-slate-900">FounderMRR</div>
          <div className="text-sm text-slate-400 mt-2">Loading leaderboard...</div>
          <div className="mt-4 w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="font-display font-bold text-xl text-slate-900">FounderMRR</div>
          <div className="text-sm text-slate-500 mt-4">
            {error === "sync_pending"
              ? "Syncing leaderboard data... This may take a minute on first load."
              : error}
          </div>
          <button onClick={retry} className="mt-4 px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {staleHours !== null && staleHours > 12 && (
        <div className="bg-amber-50 border-b border-amber-100 px-6 py-2 text-center text-xs text-amber-700">
          Data last updated {staleHours} hours ago. Sync may be delayed.
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="border border-slate-200 rounded-xl mt-6 md:mt-10 mx-4 md:mx-6 overflow-hidden">
          {/* Header */}
          <div className="px-6 md:px-8 pt-8 pb-6 border-b border-slate-200">
            <h1 className="font-display font-black text-2xl md:text-3xl tracking-tight text-slate-900">FounderMRR</h1>
            <p className="text-sm text-slate-500 mt-1">
              {totalFounders.toLocaleString()} founders ranked by verified revenue across {totalStartups.toLocaleString()} startups.
            </p>
          </div>

          <SearchBar onSearch={handleSearch} />
          <RisingStars data={data} />

          {/* Filters + Sort */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200">
            <CategoryFilter data={data} selected={category} onSelect={handleCategory} />
            <div className="px-6 md:px-8 py-2 md:py-0 flex items-center gap-2 border-b md:border-b-0 border-slate-200 md:border-none">
              <span className="text-xs text-slate-400">Sort:</span>
              {(["revenue", "mrr", "growth", "startups"] as SortKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => handleSort(key)}
                  className={`text-xs font-medium px-2 py-1 rounded transition-colors ${
                    sortKey === key ? "text-emerald-600 bg-emerald-50" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {key === "revenue" ? "Revenue" : key === "mrr" ? "MRR" : key === "growth" ? "Growth" : "# Startups"}
                </button>
              ))}
            </div>
          </div>

          {/* Results info */}
          {(search || category) && (
            <div className="px-6 md:px-8 py-2 bg-slate-50 border-b border-slate-200 text-xs text-slate-500">
              {filtered.length === 0
                ? search
                  ? `No founders matching "${search}"`
                  : `No founders in ${category}`
                : `${filtered.length.toLocaleString()} founders`}
              <button
                onClick={() => { setSearch(""); setCategory(null); }}
                className="ml-2 text-emerald-600 hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}

          <LeaderboardTable entries={visible} />

          {hasMore && (
            <div className="px-6 md:px-8 py-4 text-center border-t border-slate-200">
              <button
                onClick={() => setPage((p) => p + 1)}
                className="px-5 py-2.5 border border-slate-200 rounded-lg bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-all"
              >
                Load more &middot; showing {visible.length.toLocaleString()} of {filtered.length.toLocaleString()}
              </button>
            </div>
          )}
        </div>

        <div className="text-center py-8 text-xs text-slate-400">
          Data from <a href="https://trustmrr.com" className="text-emerald-600 hover:underline" target="_blank" rel="noopener">TrustMRR</a> &middot; Revenue verified via payment providers
        </div>
      </div>
    </div>
  );
}
