import { useMemo, useState } from "react";
import { useFirebaseData } from "../hooks/useFirebaseData";
import { Player } from "../types/types";

type RecentEvent = {
  playerId: string;
  playerName: string;
  machineName: string;
  score: number;
  timestamp?: string;
};

function formatTimeAgo(timestamp?: string) {
  if (!timestamp) return "";
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

type TimeFilter = "all" | "24h" | "7d" | "30d";

export default function AllRecentScores() {
  const { players } = useFirebaseData();
  const [search, setSearch] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");

  const events = useMemo<RecentEvent[]>(() => {
    const list: RecentEvent[] = [];
    for (const p of players as Player[]) {
      if (!p.scores) continue;
      for (const [machineName, scores] of Object.entries(p.scores)) {
        for (const entry of scores) {
          list.push({
            playerId: p.id,
            playerName: p.name,
            machineName,
            score: entry.score,
            timestamp: entry.timestamp,
          });
        }
      }
    }
    return list
      .filter((e) => e.timestamp)
      .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime());
  }, [players]);

  const filtered = useMemo(() => {
    let list = events;
    if (timeFilter !== "all") {
      const now = Date.now();
      const cutoff =
        timeFilter === "24h"
          ? now - 24 * 60 * 60 * 1000
          : timeFilter === "7d"
            ? now - 7 * 24 * 60 * 60 * 1000
            : now - 30 * 24 * 60 * 60 * 1000;
      list = list.filter((e) => (e.timestamp ? new Date(e.timestamp).getTime() >= cutoff : false));
    }

    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (e) =>
        e.playerName.toLowerCase().includes(q) ||
        e.machineName.toLowerCase().includes(q) ||
        e.score.toString().includes(q),
    );
  }, [events, search, timeFilter]);

  // Inline list view; no machine images here

  return (
    <div className="space-y-4">
      {/* Header and controls */}
      <div className="rounded-xl border border-gray-700 bg-gradient-to-br from-gray-800 to-gray-900 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h2 className="text-2xl font-bold text-amber-400">All Recent Scores</h2>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="hidden md:inline">Showing</span>
            <span className="px-2 py-1 rounded bg-gray-800 border border-gray-600 text-gray-200">
              {filtered.length}
            </span>
            <span>results</span>
          </div>
        </div>
        <div className="mt-3 flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            {(["all", "24h", "7d", "30d"] as TimeFilter[]).map((t) => (
              <button
                key={t}
                onClick={() => setTimeFilter(t)}
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
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-[360px] rounded border border-gray-600 bg-gray-900 px-3 py-2 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="Search by player, machine, or score..."
          />
        </div>
      </div>

      {/* Inline recent scores */}
      {filtered.length === 0 ? (
        <p className="text-gray-400">No recent scores found.</p>
      ) : (
        <ul className="rounded-xl border border-gray-700 bg-gray-800/60 divide-y divide-gray-700/60">
          {filtered.map((e, idx) => (
            <li
              key={`${e.playerId}-${e.timestamp}-${e.score}-${idx}`}
              className="p-3 md:p-4 flex items-center gap-4 hover:bg-gray-800/80 transition-colors"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded bg-gray-700 text-gray-300 border border-gray-600">
                🕹️
              </span>
              <div className="min-w-0">
                <div className="text-sm text-gray-200 truncate">
                  <span className="font-semibold text-blue-200">{e.playerName}</span>
                  <span className="mx-1 text-gray-500">on</span>
                  <span className="text-green-300">{e.machineName}</span>
                </div>
                {e.timestamp && (
                  <div className="text-xs text-gray-400">
                    {new Date(e.timestamp).toLocaleString()} • {formatTimeAgo(e.timestamp)}
                  </div>
                )}
              </div>
              <div className="ml-auto font-dotmatrix text-[36px] md:text-[48px] leading-none text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.25)]">
                {e.score.toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
