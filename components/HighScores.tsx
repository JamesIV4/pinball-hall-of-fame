import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { useFirebaseData } from "../hooks/useFirebaseData";
import { Machine, ScoreEntry } from "../types/types";
import { getWeekStart, getWeekEnd, formatWeekRange } from "../utils/weekUtils";
import Select from "./ui/Select";

interface HighScoresProps {
  initialViewMode?: "allTime" | "weekly";
  onNavigate?: (view: "highScores" | "highScoresWeekly") => void;
}

export default function HighScores({ initialViewMode = "allTime", onNavigate }: HighScoresProps) {
  const { machines, players } = useFirebaseData();
  const [machine, setMachine] = useState("");
  const [bestOnly, setBestOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"allTime" | "weekly">(initialViewMode);
  const [selectedWeek, setSelectedWeek] = useState(() => getWeekStart(new Date()));

  useEffect(() => {
    if (!machine && machines.length) {
      setMachine(machines[0].name);
    }
  }, [machines, machine]);

  /* ────────────────────────────────────────────
   * Assemble and (optionally) collapse scores
   * ────────────────────────────────────────── */
  const allScores = useMemo(() => {
    return players.flatMap((p) => {
      const list = p.scores?.[machine] || [];
      return list.map((s) => ({ player: p.name, score: s }));
    });
  }, [players, machine]);

  // Filter by week if in weekly mode
  const filteredScores =
    viewMode === "weekly"
      ? allScores.filter(({ score }) => {
          if (!score.timestamp) return false;
          const scoreDate = new Date(score.timestamp);
          const weekEnd = getWeekEnd(selectedWeek);
          return scoreDate >= selectedWeek && scoreDate <= weekEnd;
        })
      : allScores;

  let scores = filteredScores;
  if (bestOnly) {
    const bestMap = new Map<string, ScoreEntry>();
    for (const { player, score } of filteredScores) {
      if (!bestMap.has(player) || score.score > bestMap.get(player)!.score) {
        bestMap.set(player, score);
      }
    }
    scores = Array.from(bestMap.entries()).map(([player, score]) => ({
      player,
      score,
    }));
  }

  scores.sort((a, b) => b.score.score - a.score.score);

  const mInfo = machines.find((m) => m.name === machine);
  const machineByName = useMemo(() => {
    const map = new Map<string, Machine>();
    for (const m of machines) map.set(m.name.toLowerCase(), m);
    return map;
  }, [machines]);

  function formatStamp(ts?: string) {
    if (!ts) return "";
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return "";
    }
  }

  if (!mInfo) {
    return;
  }

  return (
    <div className="space-y-4 mx-auto">
      {/* Header and controls with optional hero image */}
      <div className="overflow-hidden rounded-xl border border-gray-700 bg-gradient-to-br from-gray-800 to-gray-900">
        {mInfo.image ? (
          <div className="relative h-36 md:h-48 w-full">
            <Image src={mInfo.image} alt={mInfo.name} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between">
              <div>
                <div className="text-sm text-gray-300">High Scores</div>
                <h2 className="text-2xl md:text-3xl font-bold text-amber-300">{mInfo.name}</h2>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <h2 className="text-2xl font-bold text-amber-300">High Scores</h2>
          </div>
        )}
        <div className="p-4 pb-0 pt-0 grid md:grid-cols-2">
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={machine}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMachine(e.target.value)}
              options={machines.map((m) => ({ value: m.name, label: m.name }))}
              placeholder="-- select --"
              className="h-[40px] mt-4"
            />
            <div className="flex items-center rounded-lg border border-gray-600 overflow-hidden">
              <button
                className={`px-3 py-[10px] text-sm ${viewMode === "allTime" ? "bg-amber-500 text-black" : "bg-gray-800 text-gray-300"}`}
                onClick={() => onNavigate?.("highScores")}
              >
                All Time
              </button>
              <button
                className={`px-3 py-[10px] text-sm ${viewMode === "weekly" ? "bg-amber-500 text-black" : "bg-gray-800 text-gray-300"}`}
                onClick={() => onNavigate?.("highScoresWeekly")}
              >
                Weekly
              </button>
            </div>
          </div>
          <label className="my-4 md:my-0 flex items-center gap-2 justify-start md:justify-end text-gray-200">
            <input
              type="checkbox"
              className="h-4 w-4 accent-amber-500"
              checked={bestOnly}
              onChange={(e) => setBestOnly(e.target.checked)}
            />
            Show best score per player only
          </label>

          {viewMode === "weekly" && (
            <div className="md:col-span-2">
              <div className="mb-4 bg-gray-800 border border-gray-700 rounded-lg p-3 flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-gray-200">{formatWeekRange(selectedWeek)}</div>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-gray-200 text-sm"
                    onClick={() => {
                      const prevWeek = new Date(selectedWeek);
                      prevWeek.setDate(prevWeek.getDate() - 7);
                      setSelectedWeek(prevWeek);
                    }}
                  >
                    ← Previous
                  </button>
                  <button
                    className={`px-3 py-1.5 rounded text-sm ${
                      selectedWeek >= getWeekStart(new Date())
                        ? "bg-gray-900 text-gray-500 cursor-not-allowed"
                        : "bg-gray-700 hover:bg-gray-600 text-gray-200"
                    }`}
                    disabled={selectedWeek >= getWeekStart(new Date())}
                    onClick={() => {
                      const nextWeek = new Date(selectedWeek);
                      nextWeek.setDate(nextWeek.getDate() + 7);
                      setSelectedWeek(nextWeek);
                    }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scores list */}
      {!machine || scores.length === 0 ? (
        <p className="text-gray-400">
          {!machine ? "Select a machine to view scores." : "No scores recorded for this machine yet."}
        </p>
      ) : (
        <ul className="rounded-xl border border-gray-700 bg-gray-800/60 divide-y divide-gray-700/60">
          {scores.map((s, i) => (
            <li
              key={`${s.player}-${s.score.timestamp}-${s.score.score}-${i}`}
              className="p-3 md:p-4 flex items-center gap-4 hover:bg-gray-800/80 transition-colors"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded bg-gray-700 text-gray-300 border border-gray-600 font-semibold">
                {i + 1}
              </span>
              <div className="min-w-0">
                <div className="text-sm text-gray-200 truncate">
                  <span className="font-semibold text-blue-200">{s.player}</span>
                </div>
                {s.score.timestamp && <div className="text-xs text-gray-400">{formatStamp(s.score.timestamp)}</div>}
              </div>
              <div className="ml-auto font-dotmatrix text-[36px] md:text-[40px] leading-none text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.25)]">
                {s.score.score.toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
