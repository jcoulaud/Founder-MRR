import { formatGrowth } from "@foundermrr/shared";

interface Props {
  growth: number | null;
}

export default function TrendArrow({ growth }: Props) {
  const formatted = formatGrowth(growth);

  if (!formatted) {
    return <span className="text-slate-300 text-xs">&mdash;</span>;
  }

  if (growth !== null && growth > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 font-mono text-xs font-semibold text-emerald-600 tabular-nums">
        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
          <path d="M6 2l4 5H2l4-5z" />
        </svg>
        {formatted}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-0.5 font-mono text-xs font-semibold text-red-500 tabular-nums">
      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
        <path d="M6 10L2 5h8L6 10z" />
      </svg>
      {formatted}
    </span>
  );
}
