import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { formatRevenue, formatRevenueExact, formatGrowth } from "@foundermrr/shared";
import { useLeaderboard } from "../hooks/useLeaderboard";
import TrendArrow from "../components/TrendArrow";
import ShareButton from "../components/ShareButton";

export default function FounderProfile() {
  const { identifier } = useParams<{ identifier: string }>();
  const { data, loading } = useLeaderboard();

  const entry = useMemo(() => {
    if (!identifier || !data.length) return null;
    return data.find((f) => f.xHandle === identifier) || null;
  }, [data, identifier]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="font-display font-bold text-xl text-slate-900">Founder not found</div>
          <p className="text-sm text-slate-500 mt-2">No founder matching &ldquo;@{identifier}&rdquo; was found.</p>
          <Link to="/" className="inline-block mt-4 px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors">
            Back to leaderboard
          </Link>
        </div>
      </div>
    );
  }

  const growth = formatGrowth(entry.avgGrowth30d);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-10">
        <Link to="/" className="text-sm text-slate-500 hover:text-emerald-600 transition-colors mb-6 inline-block">
          &larr; Back to leaderboard
        </Link>

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="px-6 md:px-8 py-6 md:py-8 flex items-center gap-4 md:gap-5 border-b border-slate-200">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center font-display font-bold text-xl text-emerald-700 flex-shrink-0">
              {entry.xHandle.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-display font-bold text-xl md:text-2xl text-slate-900">@{entry.xHandle}</h1>
              <p className="text-sm text-slate-400 mt-0.5">
                {entry.startupCount} startup{entry.startupCount > 1 ? "s" : ""}
                {entry.country && ` · ${entry.country}`}
                {entry.categories.length > 0 && ` · ${entry.categories.slice(0, 2).join(", ")}`}
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-50 border border-amber-100">
              <svg className="w-4 h-4 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 1a.75.75 0 01.65.376l1.552 2.671 3.167.39a.75.75 0 01.395 1.305l-2.21 1.984.596 3.076a.75.75 0 01-1.106.776L10 9.96l-3.044 1.618a.75.75 0 01-1.106-.776l.596-3.076-2.21-1.984a.75.75 0 01.395-1.305l3.167-.39L9.35 1.376A.75.75 0 0110 1z" clipRule="evenodd" />
              </svg>
              <span className="font-display font-bold text-amber-700 text-sm">#{entry.rank}</span>
            </div>
          </div>

          {/* Combined stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-slate-200">
            <div className="px-4 md:px-6 py-5 text-center">
              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-2">Revenue (30d)</div>
              <div className="font-mono text-xl md:text-2xl font-semibold text-slate-900 tabular-nums">{formatRevenueExact(entry.totalRevenue30d)}</div>
            </div>
            <div className="px-4 md:px-6 py-5 text-center">
              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-2">MRR</div>
              <div className="font-mono text-xl md:text-2xl font-semibold text-slate-900 tabular-nums">{formatRevenueExact(entry.totalMrr)}</div>
            </div>
            <div className="px-4 md:px-6 py-5 text-center">
              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-2">All-Time Revenue</div>
              <div className="font-mono text-xl md:text-2xl font-semibold text-slate-900 tabular-nums">{formatRevenue(entry.totalRevenueAllTime)}</div>
            </div>
            <div className="px-4 md:px-6 py-5 text-center">
              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-2">Avg Growth</div>
              <div className="text-xl md:text-2xl font-semibold">
                {growth ? (
                  <span className={`font-mono tabular-nums ${entry.avgGrowth30d! > 0 ? "text-emerald-600" : "text-red-600"}`}>{growth}</span>
                ) : (
                  <span className="text-slate-400">&mdash;</span>
                )}
              </div>
            </div>
          </div>

          {/* Startups list */}
          <div className="border-t border-slate-200">
            <div className="px-6 md:px-8 py-4 bg-slate-50">
              <h2 className="font-display font-bold text-sm text-slate-700">
                Startups ({entry.startupCount})
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {entry.startups.map((startup) => (
                <div key={startup.slug} className="px-6 md:px-8 py-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-500 flex-shrink-0 overflow-hidden">
                    {startup.icon ? (
                      <img src={startup.icon} alt="" className="w-full h-full object-cover" />
                    ) : (
                      startup.name.charAt(0)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-slate-900">{startup.name}</div>
                    <div className="text-xs text-slate-400">
                      {startup.category || "Uncategorized"}
                      {startup.onSale && <span className="ml-2 text-amber-600 font-medium">For Sale</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-mono text-sm font-medium text-slate-900 tabular-nums">
                      {formatRevenue(startup.revenue30d)}/mo
                    </div>
                    {startup.mrr > 0 && (
                      <div className="font-mono text-xs text-slate-400 tabular-nums">
                        MRR: {formatRevenue(startup.mrr)}
                      </div>
                    )}
                  </div>
                  <div className="w-16 text-right">
                    <TrendArrow growth={startup.growth30d} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Share */}
          <div className="px-6 md:px-8 py-5 border-t border-slate-200">
            <ShareButton entry={entry} />
          </div>
        </div>
      </div>
    </div>
  );
}
