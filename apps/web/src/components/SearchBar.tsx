import { useEffect, useRef, useState } from "react";

interface Props {
  onSearch: (query: string) => void;
}

export default function SearchBar({ onSearch }: Props) {
  const [value, setValue] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onSearch(value), 300);
    return () => clearTimeout(timer.current);
  }, [value, onSearch]);

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus-within:border-emerald-300 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
        <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          placeholder="Search founders, startups..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-400"
        />
        {value && (
          <button
            onClick={() => setValue("")}
            className="text-xs font-medium text-slate-400 hover:text-slate-600 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
