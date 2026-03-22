import type { FounderEntry } from "@foundermrr/shared";
import { formatRevenue } from "@foundermrr/shared";
import { Link } from "react-router-dom";
import TrendArrow from "./TrendArrow";

interface Props {
  entries: FounderEntry[];
}

const AVATAR_COLORS = [
  "from-emerald-200 to-emerald-100 text-emerald-800",
  "from-sky-200 to-sky-100 text-sky-800",
  "from-violet-200 to-violet-100 text-violet-800",
  "from-rose-200 to-rose-100 text-rose-800",
  "from-amber-200 to-amber-100 text-amber-800",
  "from-teal-200 to-teal-100 text-teal-800",
  "from-indigo-200 to-indigo-100 text-indigo-800",
  "from-pink-200 to-pink-100 text-pink-800",
];

function avatarColor(handle: string) {
  let hash = 0;
  for (let i = 0; i < handle.length; i++) hash = ((hash << 5) - hash + handle.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-b from-amber-200 to-amber-100 font-display font-bold text-sm text-amber-800 ring-1 ring-amber-300/50 shadow-sm">
        1
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-b from-slate-200 to-slate-100 font-display font-bold text-sm text-slate-700 ring-1 ring-slate-300/50">
        2
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-b from-amber-100 to-amber-50 font-display font-bold text-sm text-amber-700 ring-1 ring-amber-200/50">
        3
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-50 font-display font-semibold text-sm text-slate-400">
      {rank}
    </span>
  );
}

function FounderAvatar({ handle }: { handle: string }) {
  return (
    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarColor(handle)} flex items-center justify-center font-display font-bold text-sm flex-shrink-0`}>
      {handle.charAt(0).toUpperCase()}
    </div>
  );
}

export default function LeaderboardTable({ entries }: Props) {
  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50/80">
              <th className="pl-6 pr-2 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400 w-14">#</th>
              <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Founder</th>
              <th className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400 w-24">Startups</th>
              <th className="px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">Revenue (30d)</th>
              <th className="px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">MRR</th>
              <th className="pr-6 pl-3 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400 w-24">Growth</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const isTop3 = entry.rank <= 3;
              return (
                <tr
                  key={entry.xHandle}
                  className={`border-b border-slate-100 hover:bg-emerald-50/40 transition-colors ${isTop3 ? "bg-white" : ""}`}
                >
                  <td className="pl-6 pr-2 py-3.5">
                    <RankBadge rank={entry.rank} />
                  </td>
                  <td className="px-3 py-3.5">
                    <Link to={`/founder/${entry.xHandle}`} className="group flex items-center gap-3">
                      <FounderAvatar handle={entry.xHandle} />
                      <div className="min-w-0">
                        <div className={`font-semibold text-sm group-hover:text-emerald-600 transition-colors ${isTop3 ? "text-slate-900" : "text-slate-700"}`}>
                          @{entry.xHandle}
                        </div>
                        <div className="text-xs text-slate-400 truncate max-w-xs">
                          {entry.startups.slice(0, 3).map((s) => s.name).join(", ")}
                          {entry.startupCount > 3 && ` +${entry.startupCount - 3}`}
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-3 py-3.5 text-center">
                    <span className="inline-flex items-center justify-center min-w-6 h-6 rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                      {entry.startupCount}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-right">
                    <span className={`font-mono font-semibold text-sm tabular-nums ${isTop3 ? "text-slate-900" : "text-slate-700"}`}>
                      {formatRevenue(entry.totalRevenue30d)}/mo
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-right">
                    <span className="font-mono text-sm text-slate-400 tabular-nums">
                      {formatRevenue(entry.totalMrr)}
                    </span>
                  </td>
                  <td className="pr-6 pl-3 py-3.5 text-right">
                    <TrendArrow growth={entry.avgGrowth30d} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-slate-100">
        {entries.map((entry) => (
          <Link
            key={entry.xHandle}
            to={`/founder/${entry.xHandle}`}
            className="flex items-center gap-3 px-5 py-3.5 hover:bg-emerald-50/40 active:bg-emerald-50/60 transition-colors"
          >
            <RankBadge rank={entry.rank} />
            <FounderAvatar handle={entry.xHandle} />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-slate-900">@{entry.xHandle}</div>
              <div className="text-xs text-slate-400">
                {entry.startups.slice(0, 2).map((s) => s.name).join(", ")}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="font-mono font-semibold text-sm text-slate-900 tabular-nums">{formatRevenue(entry.totalRevenue30d)}/mo</div>
              <TrendArrow growth={entry.avgGrowth30d} />
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
