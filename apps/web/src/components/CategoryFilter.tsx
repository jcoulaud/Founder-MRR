import type { FounderEntry } from "@foundermrr/shared";
import { useMemo } from "react";

interface Props {
  data: FounderEntry[];
  selected: string | null;
  onSelect: (category: string | null) => void;
}

export default function CategoryFilter({ data, selected, onSelect }: Props) {
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const founder of data) {
      for (const cat of founder.categories) {
        counts.set(cat, (counts.get(cat) || 0) + 1);
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [data]);

  return (
    <div className="flex gap-2 px-6 md:px-8 py-3.5 border-b border-slate-200 flex-wrap">
      <button
        onClick={() => onSelect(null)}
        className={`px-4 py-2 rounded-full text-[13px] font-medium border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 ${
          selected === null
            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
        }`}
      >
        All{" "}
        <span className={`ml-0.5 ${selected === null ? "text-white/70" : "text-slate-400"}`}>
          {data.length.toLocaleString()}
        </span>
      </button>
      {categories.slice(0, 8).map(([cat, count]) => (
        <button
          key={cat}
          onClick={() => onSelect(selected === cat ? null : cat)}
          className={`px-4 py-2 rounded-full text-[13px] font-medium border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 ${
            selected === cat
              ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
              : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
          }`}
        >
          {cat}{" "}
          <span className={`ml-0.5 ${selected === cat ? "text-white/70" : "text-slate-400"}`}>
            {count}
          </span>
        </button>
      ))}
    </div>
  );
}
