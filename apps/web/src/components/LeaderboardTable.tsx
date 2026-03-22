import type { FounderEntry } from "@foundermrr/shared";
import { formatRevenue } from "@foundermrr/shared";
import { Link } from "react-router-dom";
import TrendArrow from "./TrendArrow";

interface Props {
  entries: FounderEntry[];
}

function RankBadge({ rank }: { rank: number }) {
  const styles =
    rank === 1
      ? "bg-amber-100 text-amber-700"
      : rank === 2
        ? "bg-slate-100 text-slate-600"
        : rank === 3
          ? "bg-amber-50 text-amber-600"
          : "bg-slate-50 text-slate-500";

  return (
    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-md font-display font-bold text-xs ${styles}`}>
      {rank}
    </span>
  );
}

export default function LeaderboardTable({ entries }: Props) {
  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              <th className="pl-8 pr-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-400 w-16">Rank</th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-slate-400">Founder</th>
              <th className="px-4 py-3 text-center text-[11px] font-medium uppercase tracking-wider text-slate-400">Startups</th>
              <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-slate-400">Revenue (30d)</th>
              <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-slate-400">MRR</th>
              <th className="pr-8 pl-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-slate-400">Growth</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.xHandle} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="pl-8 pr-4 py-3.5">
                  <RankBadge rank={entry.rank} />
                </td>
                <td className="px-4 py-3.5">
                  <Link to={`/founder/${entry.xHandle}`} className="group">
                    <div className="font-semibold text-sm text-slate-900 group-hover:text-emerald-600 transition-colors">
                      @{entry.xHandle}
                    </div>
                    <div className="text-xs text-slate-400 truncate max-w-xs">
                      {entry.startups.slice(0, 3).map((s) => s.name).join(", ")}
                      {entry.startupCount > 3 && ` +${entry.startupCount - 3}`}
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3.5 text-center">
                  <span className="inline-flex items-center justify-center min-w-6 h-6 rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                    {entry.startupCount}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span className="font-mono font-semibold text-sm text-slate-900 tabular-nums">
                    {formatRevenue(entry.totalRevenue30d)}/mo
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span className="font-mono text-sm text-slate-500 tabular-nums">
                    {formatRevenue(entry.totalMrr)}
                  </span>
                </td>
                <td className="pr-8 pl-4 py-3.5 text-right">
                  <TrendArrow growth={entry.avgGrowth30d} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-slate-100">
        {entries.map((entry) => (
          <Link
            key={entry.xHandle}
            to={`/founder/${entry.xHandle}`}
            className="flex items-center gap-3 px-6 py-3.5 hover:bg-slate-50 transition-colors"
          >
            <RankBadge rank={entry.rank} />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-slate-900">@{entry.xHandle}</div>
              <div className="text-xs text-slate-400">{entry.startupCount} startup{entry.startupCount > 1 ? "s" : ""}</div>
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
