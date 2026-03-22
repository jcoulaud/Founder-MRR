import { formatGrowth } from "@foundermrr/shared";

interface Props {
  growth: number | null;
}

export default function TrendArrow({ growth }: Props) {
  const formatted = formatGrowth(growth);

  if (!formatted) {
    return <span className="text-slate-400 text-xs">&mdash;</span>;
  }

  if (growth! > 0) {
    return <span className="font-mono text-xs font-medium text-emerald-600">{formatted}</span>;
  }

  return <span className="font-mono text-xs font-medium text-red-600">{formatted}</span>;
}
