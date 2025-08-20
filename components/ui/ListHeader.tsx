import React from "react";

export type TimeFilter = "all" | "24h" | "7d" | "30d";

interface ListHeaderProps {
  title: string;
  count: number;
  timeFilter: TimeFilter;
  onTimeFilterChange: (value: TimeFilter) => void;
  search: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
}

export default function ListHeader({
  title,
  count,
  timeFilter,
  onTimeFilterChange,
  search,
  onSearchChange,
  placeholder = "Search...",
}: ListHeaderProps) {
  return (
    <div className="rounded-xl border border-gray-700 bg-gradient-to-br from-gray-800 to-gray-900 p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h2 className="text-2xl font-bold text-amber-400">{title}</h2>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="hidden md:inline">Showing</span>
          <span className="px-2 py-1 rounded bg-gray-800 border border-gray-600 text-gray-200">{count}</span>
          <span>results</span>
        </div>
      </div>
      <div className="mt-3 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          {(["all", "24h", "7d", "30d"] as TimeFilter[]).map((t) => (
            <button
              key={t}
              onClick={() => onTimeFilterChange(t)}
              className={`px-3 py-1.5 rounded border text-xs transition-colors ${
                timeFilter === t
                  ? "border-amber-500 bg-amber-500/10 text-amber-300"
                  : "border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500"
              }`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full md:w-[360px] rounded border border-gray-600 bg-gray-900 px-3 py-2 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

