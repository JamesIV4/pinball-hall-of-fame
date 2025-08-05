import { useEffect, useState } from "react";
import { Machine, Player, ScoreEntry } from "../types/types";
import ScoreWithTooltip from "./ScoreWithTooltip";
import FormContainer from "./ui/FormContainer";
import Select from "./ui/Select";
import Button from "./ui/Button";
import MachineInfo from "./ui/MachineInfo";
import { useFirebaseData } from "../hooks/useFirebaseData";

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekEnd(weekStart: Date): Date {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

function formatWeekRange(weekStart: Date): string {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return `${weekStart.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })} -> ${weekEnd.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })}`;
}

interface HighScoresProps {
  initialViewMode?: "allTime" | "weekly";
}

export default function HighScores({ initialViewMode = "allTime" }: HighScoresProps) {
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
  const allScores = players.flatMap((p) => {
    const list = p.scores?.[machine] || [];
    return list.map((s) => ({ player: p.name, score: s }));
  });

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

  return (
    <FormContainer title="High Scores by Machine">

      <Select
        value={machine}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMachine(e.target.value)}
        options={machines.map((m) => ({ value: m.name, label: m.name }))}
        placeholder="-- select --"
        className="mb-4"
      />

      <div className="flex gap-2 mb-4">
        <Button
          variant={viewMode === "allTime" ? "primary" : "secondary"}
          onClick={() => setViewMode("allTime")}
        >
          All Time
        </Button>
        <Button
          variant={viewMode === "weekly" ? "primary" : "secondary"}
          onClick={() => setViewMode("weekly")}
        >
          Weekly
        </Button>
      </div>

      {/* Week selector for weekly mode */}
      {viewMode === "weekly" && (
        <div className="flex justify-center mb-4">
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-center text-gray-200 font-medium mb-3">{formatWeekRange(selectedWeek)}</div>
            <div className="flex gap-2">
              <button
                className="w-[160px] px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-gray-200 select-none transition-colors"
                onClick={() => {
                  const prevWeek = new Date(selectedWeek);
                  prevWeek.setDate(prevWeek.getDate() - 7);
                  setSelectedWeek(prevWeek);
                }}
              >
                ← Previous Week
              </button>
              <button
                className={`w-[160px] px-4 py-2 rounded-lg select-none transition-colors ${
                  selectedWeek >= getWeekStart(new Date())
                    ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                    : "bg-gray-600 hover:bg-gray-500 text-gray-200"
                }`}
                disabled={selectedWeek >= getWeekStart(new Date())}
                onClick={() => {
                  const nextWeek = new Date(selectedWeek);
                  nextWeek.setDate(nextWeek.getDate() + 7);
                  setSelectedWeek(nextWeek);
                }}
              >
                Next Week →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* best-only toggle */}
      <label className="flex items-center gap-2 text-gray-200 mb-6">
        <input
          type="checkbox"
          className="h-4 w-4 accent-amber-500"
          checked={bestOnly}
          onChange={(e) => setBestOnly(e.target.checked)}
        />
        Show best score per player only
      </label>

      {machine &&
        (!scores.length ? (
          <p className="text-gray-400">No scores recorded for this machine yet.</p>
        ) : (
          <>
            <div className="flex items-center mb-4">
              {mInfo && <MachineInfo machine={mInfo} imageSize="lg" />}
              <h3 className="text-xl font-bold text-amber-300 ml-4">{machine} – High Scores</h3>
            </div>
            <table className="w-full text-left table-auto">
              <thead>
                <tr className="bg-gray-700">
                  <th className="p-3">Rank</th>
                  <th className="p-3">Player</th>
                  <th className="p-3 hidden md:table-cell">Date</th>
                  <th className="p-3 text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {scores.map((s, i) => (
                  <tr key={i} className={i % 2 ? "bg-gray-700/50" : "bg-gray-800/50"}>
                    <td className="pl-6 font-bold">{i + 1}</td>
                    <td className="p-3">{s.player}</td>
                    <td className="p-3 text-gray-400 hidden md:table-cell">
                      {s.score.timestamp
                        ? new Date(s.score.timestamp).toLocaleString(undefined, {
                            year: "numeric",
                            month: "numeric",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })
                        : ""}
                    </td>
                    <td className="p-3 text-right">
                      <ScoreWithTooltip score={s.score} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ))}
    </FormContainer>
  );
}
