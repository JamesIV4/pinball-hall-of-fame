import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { getFirebase } from "@/lib/firebase";
import { Machine, Player, ScoreEntry } from "../types/types";
import ScoreWithTooltip from "./ScoreWithTooltip";

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

export default function HighScores() {
  const { db } = getFirebase();

  const [machines, setMachines] = useState<Machine[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [machine, setMachine] = useState(""); // selected machine
  const [bestOnly, setBestOnly] = useState(false); // toggle "best per player"
  const [viewMode, setViewMode] = useState<"allTime" | "weekly">("allTime");
  const [selectedWeek, setSelectedWeek] = useState(() =>
    getWeekStart(new Date())
  );

  /* ────────────────────────────────────────────
   * Load machines & players
   * ────────────────────────────────────────── */
  useEffect(() => {
    const unsubM = onSnapshot(
      collection(db, "data/machines/machines"),
      (snap) => {
        const machineList = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));
        // Sort machines alphabetically by name
        machineList.sort((a, b) => a.name.localeCompare(b.name));
        setMachines(machineList);
      }
    );
    const unsubP = onSnapshot(
      collection(db, "data/players/players"),
      (snap) => {
        setPlayers(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      }
    );
    return () => {
      unsubM();
      unsubP();
    };
  }, [db]);

  /* ────────────────────────────────────────────
   *  NEW: pick first machine as default
   * ────────────────────────────────────────── */
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

  /* ────────────────────────────────────────────
   *  Render
   * ────────────────────────────────────────── */
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-amber-400">
        High Scores by Machine
      </h2>

      {/* machine selector */}
      <select
        className="w-full p-2 rounded-lg bg-gray-700 mb-4"
        value={machine}
        onChange={(e) => setMachine(e.target.value)}
      >
        <option value="">-- select --</option>
        {machines.map((m) => (
          <option key={m.id} value={m.name}>
            {m.name}
          </option>
        ))}
      </select>

      {/* View mode toggle */}
      <div className="flex gap-2 mb-4">
        <button
          className={`px-4 py-2 rounded-lg font-medium ${
            viewMode === "allTime"
              ? "bg-amber-500 text-black"
              : "bg-gray-700 text-gray-200 hover:bg-gray-600"
          }`}
          onClick={() => setViewMode("allTime")}
        >
          All Time
        </button>
        <button
          className={`px-4 py-2 rounded-lg font-medium ${
            viewMode === "weekly"
              ? "bg-amber-500 text-black"
              : "bg-gray-700 text-gray-200 hover:bg-gray-600"
          }`}
          onClick={() => setViewMode("weekly")}
        >
          Weekly
        </button>
      </div>

      {/* Week selector for weekly mode */}
      {viewMode === "weekly" && (
        <div className="flex justify-center mb-4">
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-center text-gray-200 font-medium mb-3">
              {formatWeekRange(selectedWeek)}
            </div>
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
          <p className="text-gray-400">
            No scores recorded for this machine yet.
          </p>
        ) : (
          <>
            <div className="flex items-center mb-4">
              {mInfo?.image && (
                <img
                  src={mInfo.image}
                  alt="machine"
                  className="w-24 h-32 object-cover rounded-lg mr-4"
                />
              )}
              <h3 className="text-xl font-bold text-amber-300">
                {machine} – High Scores
              </h3>
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
                  <tr
                    key={i}
                    className={i % 2 ? "bg-gray-700/50" : "bg-gray-800/50"}
                  >
                    <td className="pl-6 font-bold">{i + 1}</td>
                    <td className="p-3">{s.player}</td>
                    <td className="p-3 text-gray-400 hidden md:table-cell">
                      {s.score.timestamp
                        ? new Date(s.score.timestamp).toLocaleString(
                            undefined,
                            {
                              year: "numeric",
                              month: "numeric",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            }
                          )
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
    </div>
  );
}
