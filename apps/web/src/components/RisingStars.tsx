import type { FounderEntry } from "@foundermrr/shared";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { formatRevenue, formatGrowth } from "@foundermrr/shared";

interface Props {
  data: FounderEntry[];
}

const MIN_REVENUE = 500; // $500/mo minimum revenue

export default function RisingStars({ data }: Props) {
  const stars = useMemo(() => {
    return data
      .filter((f) => f.avgGrowth30d !== null && f.avgGrowth30d > 0 && f.totalRevenue30d >= MIN_REVENUE)
      .sort((a, b) => (b.avgGrowth30d ?? 0) - (a.avgGrowth30d ?? 0))
      .slice(0, 10);
  }, [data]);

  if (stars.length === 0) return null;

  return (
    <div className="px-6 md:px-8 py-5 border-b border-slate-200 bg-gradient-to-br from-amber-50 to-white">
      <h3 className="font-display font-bold text-sm text-amber-700 mb-3 flex items-center gap-1.5">
        <span>&#128293;</span> Rising Founders
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
        {stars.map((entry) => (
          <Link
            key={entry.xHandle}
            to={`/founder/${entry.xHandle}`}
            className="flex-none w-44 p-3.5 bg-white border border-amber-100 rounded-lg hover:border-amber-400 hover:shadow-sm transition-all"
          >
            <div className="font-semibold text-sm text-slate-900 truncate">@{entry.xHandle}</div>
            <div className="text-xs text-slate-400 mt-0.5">
              {entry.startupCount} startup{entry.startupCount > 1 ? "s" : ""}
            </div>
            <div className="font-mono text-lg font-semibold text-emerald-600 mt-2">
              {formatGrowth(entry.avgGrowth30d)}
            </div>
            <div className="font-mono text-xs text-slate-400 mt-0.5">
              {formatRevenue(entry.totalRevenue30d)}/mo
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
