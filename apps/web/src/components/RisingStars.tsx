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
        <svg className="w-4 h-4 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 0011.95 4.95c.592-.591.98-1.318 1.22-2.05.122-.37.2-.753.222-1.13a.513.513 0 00-.084-.3.527.527 0 00-.349-.2.51.51 0 00-.386.08.504.504 0 00-.2.303c-.09.363-.247.715-.478 1.048a5 5 0 01-7.59.378A5.002 5.002 0 015 11a4.98 4.98 0 011.05-3.074c.02.907.154 1.727.548 2.542a4.63 4.63 0 002.47 2.313 1 1 0 001.327-.898c.095-1.399.331-2.687.625-3.808.147-.559.32-1.074.515-1.516.082-.186.169-.36.263-.52z" clipRule="evenodd" />
        </svg>
        Rising Founders
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
