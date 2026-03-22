import { useEffect, useMemo } from "react";
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="font-display font-bold text-xl text-slate-900">Founder not found</div>
          <p className="text-sm text-slate-500 mt-2">No founder matching &ldquo;@{identifier}&rdquo; was found.</p>
          <Link to="/" className="inline-block mt-4 px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors">
            Back to leaderboard
          </Link>
        </div>
      </div>
    );
  }

  useEffect(() => {
    document.title = `@${entry.xHandle} — #${entry.rank} on FounderMRR`;
    return () => { document.title = "FounderMRR — Verified Founder Revenue, Ranked"; };
  }, [entry.xHandle, entry.rank]);

  const growth = formatGrowth(entry.avgGrowth30d);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-10">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-600 transition-colors mb-6 group">
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to leaderboard
        </Link>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          {/* Header */}
          <div className="px-6 md:px-8 py-8 md:py-10 flex items-center gap-4 md:gap-5 border-b border-slate-200">
            <div className="flex-1 min-w-0">
              <h1 className="font-display font-black text-2xl md:text-3xl text-slate-900 tracking-tight">@{entry.xHandle}</h1>
              <p className="text-sm text-slate-500 mt-1">
                {entry.startupCount} startup{entry.startupCount > 1 ? "s" : ""}
                {entry.country && <span className="mx-1.5 text-slate-300">&middot;</span>}
                {entry.country && entry.country}
                {entry.categories.length > 0 && <span className="mx-1.5 text-slate-300">&middot;</span>}
                {entry.categories.length > 0 && entry.categories.slice(0, 2).join(", ")}
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-b from-amber-50 to-amber-100/50 border border-amber-200">
              <svg className="w-4 h-4 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 1a.75.75 0 01.65.376l1.552 2.671 3.167.39a.75.75 0 01.395 1.305l-2.21 1.984.596 3.076a.75.75 0 01-1.106.776L10 9.96l-3.044 1.618a.75.75 0 01-1.106-.776l.596-3.076-2.21-1.984a.75.75 0 01.395-1.305l3.167-.39L9.35 1.376A.75.75 0 0110 1z" clipRule="evenodd" />
              </svg>
              <span className="font-display font-bold text-amber-800 text-base">#{entry.rank}</span>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4">
            {[
              { label: "Revenue (30d)", value: formatRevenueExact(entry.totalRevenue30d), color: "text-slate-900" },
              { label: "MRR", value: formatRevenueExact(entry.totalMrr), color: "text-slate-900" },
              { label: "All-Time Revenue", value: formatRevenue(entry.totalRevenueAllTime), color: "text-slate-900" },
              { label: "Avg Growth", value: growth, color: entry.avgGrowth30d && entry.avgGrowth30d > 0 ? "text-emerald-600" : entry.avgGrowth30d && entry.avgGrowth30d < 0 ? "text-red-600" : "text-slate-400" },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className={`px-5 md:px-6 py-6 text-center ${i < 2 ? "border-b border-slate-100 md:border-b-0" : ""} ${i % 2 === 0 ? "border-r border-slate-100" : ""} ${i === 1 ? "md:border-r md:border-slate-100" : ""} ${i === 2 ? "md:border-r md:border-slate-100" : ""}`}
              >
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">{stat.label}</div>
                <div className={`font-mono text-2xl md:text-[28px] font-bold tabular-nums leading-tight ${stat.color}`}>
                  {stat.value || "\u2014"}
                </div>
              </div>
            ))}
          </div>

          {/* Startups list */}
          <div className="border-t border-slate-200">
            <div className="px-6 md:px-8 py-4 bg-slate-50/80">
              <h2 className="font-display font-bold text-sm text-slate-700">
                Startups ({entry.startupCount})
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {entry.startups.map((startup) => (
                <div key={startup.slug} className="px-6 md:px-8 py-4 flex items-center gap-3.5 hover:bg-slate-50/50 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0 overflow-hidden">
                    {startup.icon ? (
                      <img src={startup.icon} alt="" className="w-full h-full object-cover" />
                    ) : (
                      startup.name.charAt(0)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-slate-900">{startup.name}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      {startup.category || "Uncategorized"}
                      {startup.onSale && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-700">
                          For Sale
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
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
          <div className="px-6 md:px-8 py-5 border-t border-slate-200 bg-slate-50/50">
            <ShareButton entry={entry} />
          </div>
        </div>
      </div>
    </div>
  );
}
