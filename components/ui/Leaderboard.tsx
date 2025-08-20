import React from "react";

export type LeaderboardItem = {
  name: string;
  count: number;
  onClick?: () => void;
};

interface LeaderboardProps {
  title: string;
  items: LeaderboardItem[];
  emptyMessage?: string;
  nameColorClass?: string; // e.g., 'text-blue-200'
  barColorClass?: string; // e.g., 'bg-blue-500'
}

export default function Leaderboard({
  title,
  items,
  emptyMessage = "No data.",
  nameColorClass = "text-gray-200",
  barColorClass = "bg-gray-400",
}: LeaderboardProps) {
  const max = items.length ? items[0].count || 1 : 1;
  return (
    <div>
      <h3 className="text-lg font-bold text-gray-200">{title}</h3>
      {items.length === 0 ? (
        <div className="text-sm text-gray-400 mt-2">{emptyMessage}</div>
      ) : (
        <ul className="mt-2 space-y-2">
          {items.map((it, idx) => {
            const pct = Math.round((it.count / max) * 100);
            return (
              <li key={it.name} className="text-sm">
                <div className="flex justify-between">
                  <span className={nameColorClass}>
                    {idx + 1}.{" "}
                    {it.onClick ? (
                      <button className="hover:underline" onClick={it.onClick} title={it.name}>
                        {it.name}
                      </button>
                    ) : (
                      it.name
                    )}
                  </span>
                  <span className="text-gray-400">{it.count}</span>
                </div>
                <div className="mt-1 h-1.5 rounded bg-gray-700">
                  <div className={`h-1.5 rounded ${barColorClass}`} style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
