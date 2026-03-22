import { useEffect, useRef, useState } from "react";

interface Props {
  onSearch: (query: string) => void;
}

export default function SearchBar({ onSearch }: Props) {
  const [value, setValue] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onSearch(value), 300);
    return () => clearTimeout(timer.current);
  }, [value, onSearch]);

  return (
    <div className="flex items-center gap-2 px-6 md:px-8 border-b border-slate-200">
      <span className="text-slate-400 text-sm">&#128269;</span>
      <input
        type="text"
        placeholder="Search founders, startups..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="flex-1 py-3.5 bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-400 font-body"
      />
      {value && (
        <button
          onClick={() => setValue("")}
          className="text-xs text-slate-400 hover:text-slate-600"
        >
          Clear
        </button>
      )}
    </div>
  );
}
