import { useMemo, useState, useEffect } from "react";
import { doc, updateDoc, arrayRemove, arrayUnion, deleteField } from "firebase/firestore";
import { getFirebase } from "@/lib/firebase";
import Toast from "./ui/Toast";
import PasswordModal from "./ui/PasswordModal";
import { ScoreEntry } from "../types/types";
import { useFirebaseData } from "../hooks/useFirebaseData";
import { formatScore } from "../utils/scoreUtils";
import { goToHighScoresForMachine, goToPlayerStatsForPlayer } from "../utils/navigation";

type RecentEvent = {
  playerId: string;
  playerName: string;
  machineName: string;
  entry: ScoreEntry;
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

export default function ManageScores() {
  const { db } = getFirebase();
  const { machines, players } = useFirebaseData();

  const [toast, setToast] = useState<{ msg: string; type?: "success" | "error" }>({ msg: "" });
  const [editingScore, setEditingScore] = useState<{
    playerId: string;
    machineName: string;
    originalScore: ScoreEntry;
    newScore: number;
    newScoreDisplay: string;
    newDateTime: string;
  } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    playerId: string;
    machineName: string;
    score: ScoreEntry;
  } | null>(null);

  const [search, setSearch] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [openMenuKey, setOpenMenuKey] = useState<string | null>(null);

  useEffect(() => {
    const handler = () => setOpenMenuKey(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const events = useMemo<RecentEvent[]>(() => {
    const list: RecentEvent[] = [];
    for (const p of players) {
      if (!p.scores) continue;
      for (const [machineName, scores] of Object.entries(p.scores)) {
        for (const entry of scores) {
          list.push({
            playerId: p.id,
            playerName: p.name,
            machineName,
            entry,
          });
        }
      }
    }
    return list.sort((a, b) => {
      const ta = a.entry.timestamp ? new Date(a.entry.timestamp).getTime() : 0;
      const tb = b.entry.timestamp ? new Date(b.entry.timestamp).getTime() : 0;
      return tb - ta;
    });
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
      list = list.filter((e) => (e.entry.timestamp ? new Date(e.entry.timestamp).getTime() >= cutoff : false));
    }

    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (e) =>
        e.playerName.toLowerCase().includes(q) ||
        e.machineName.toLowerCase().includes(q) ||
        e.entry.score.toString().includes(q),
    );
  }, [events, search, timeFilter]);

  function requestDeleteScore(playerId: string, machineName: string, score: ScoreEntry) {
    setDeleteModal({ playerId, machineName, score });
  }

  async function confirmDeleteScore() {
    if (!deleteModal) return;

    try {
      const player = players.find((p) => p.id === deleteModal.playerId);
      const machineScores = player?.scores?.[deleteModal.machineName] || [];

      if (machineScores.length === 1) {
        // Last score for this machine - remove the entire machine field
        await updateDoc(doc(db, "data/players/players", deleteModal.playerId), {
          [`scores.${deleteModal.machineName}`]: deleteField(),
        });
      } else {
        // Multiple scores exist - just remove this one
        await updateDoc(doc(db, "data/players/players", deleteModal.playerId), {
          [`scores.${deleteModal.machineName}`]: arrayRemove(deleteModal.score),
        });
      }
      setToast({ msg: "Score deleted!" });
      setDeleteModal(null);
    } catch (err) {
      console.error(err);
      setToast({ msg: "Error deleting score", type: "error" });
    }
  }

  function startEdit(playerId: string, machineName: string, score: ScoreEntry) {
    const dateTime = score.timestamp
      ? new Date(score.timestamp).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16);

    setEditingScore({
      playerId,
      machineName,
      originalScore: score,
      newScore: score.score,
      newScoreDisplay: formatScore(score.score.toString()),
      newDateTime: dateTime,
    });
  }

  async function saveEdit() {
    if (!editingScore) return;

    try {
      const { playerId, machineName, originalScore, newScore, newDateTime } = editingScore;

      // Remove old score
      await updateDoc(doc(db, "data/players/players", playerId), {
        [`scores.${machineName}`]: arrayRemove(originalScore),
      });

      // Add updated score
      const updatedScore: ScoreEntry = {
        score: newScore,
        timestamp: new Date(newDateTime).toISOString(),
      };

      await updateDoc(doc(db, "data/players/players", playerId), {
        [`scores.${machineName}`]: arrayUnion(updatedScore),
      });

      setEditingScore(null);
      setToast({ msg: "Score updated!" });
    } catch (err) {
      console.error(err);
      setToast({ msg: "Error updating score", type: "error" });
    }
  }

  return (
    <>
      <Toast message={toast.msg} type={toast.type} clear={() => setToast({ msg: "" })} />

      <div className="space-y-4">
        {/* Header and controls (single card like Recent Scores) */}
        <div className="rounded-xl border border-gray-700 bg-gradient-to-br from-gray-800 to-gray-900 p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <h2 className="text-2xl font-bold text-amber-400">Manage Scores</h2>
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

        {/* Inline list with actions */}
        {filtered.length === 0 ? (
          <p className="text-gray-400">No scores found.</p>
        ) : (
          <ul className="rounded-xl border border-gray-700 bg-gray-800/60 divide-y divide-gray-700/60">
            {filtered.map((e, idx) => (
              <li
                key={`${e.playerId}-${e.entry.timestamp ?? "no-ts"}-${e.entry.score}-${idx}`}
                className="relative p-3 md:p-4 flex items-center gap-4 hover:bg-gray-800/80 transition-colors"
              >
                {/* Desktop: separate icon buttons */}
                <div className="hidden md:flex items-center gap-2">
                  {/* Edit button (blue) */}
                  <button
                    onClick={() => startEdit(e.playerId, e.machineName, e.entry)}
                    title="Edit score"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 hover:bg-blue-500 text-white border border-blue-700 shadow-sm"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden
                    >
                      <path d="M17.414 2.586a2 2 0 010 2.828l-9.9 9.9a1 1 0 01-.465.263l-4 1a1 1 0 01-1.213-1.213l1-4a1 1 0 01.263-.465l9.9-9.9a2 2 0 012.828 0z" />
                    </svg>
                  </button>

                  {/* Delete button (red X) */}
                  <button
                    onClick={() => requestDeleteScore(e.playerId, e.machineName, e.entry)}
                    title="Delete score"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-red-600 hover:bg-red-500 text-white border border-red-700 shadow-sm"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 011.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-sm text-gray-200 truncate">
                    <button
                      className="font-semibold text-blue-200 hover:underline"
                      onClick={() => goToPlayerStatsForPlayer(e.playerId)}
                      title="View player stats"
                    >
                      {e.playerName}
                    </button>
                    <span className="mx-1 text-gray-500">on</span>
                    <button
                      className="text-green-300 hover:underline"
                      onClick={() => goToHighScoresForMachine(e.machineName)}
                      title="View machine high scores"
                    >
                      {e.machineName}
                    </button>
                  </div>
                  {e.entry.timestamp && (
                    <div className="text-xs text-gray-400">
                      {new Date(e.entry.timestamp).toLocaleString()} • {formatTimeAgo(e.entry.timestamp)}
                    </div>
                  )}
                </div>

                <div className="ml-2 md:ml-auto flex items-center gap-2">
                  <div className="font-dotmatrix text-[36px] md:text-[48px] leading-none text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.25)]">
                    {e.entry.score.toLocaleString()}
                  </div>

                  {/* Mobile: hamburger menu on the right */}
                  <div className="md:hidden relative">
                    <button
                      onClick={(ev) => {
                        ev.stopPropagation();
                        const key = `${e.playerId}-${e.entry.timestamp ?? "no-ts"}-${e.entry.score}-${idx}`;
                        setOpenMenuKey((cur) => (cur === key ? null : key));
                      }}
                      title="Actions"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-gray-700 hover:bg-gray-600 text-white border border-gray-600 shadow-sm"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden
                      >
                        <circle cx="6" cy="12" r="1.5" />
                        <circle cx="12" cy="12" r="1.5" />
                        <circle cx="18" cy="12" r="1.5" />
                      </svg>
                    </button>

                    {openMenuKey === `${e.playerId}-${e.entry.timestamp ?? "no-ts"}-${e.entry.score}-${idx}` && (
                      <div
                        onClick={(ev) => ev.stopPropagation()}
                        className="absolute z-10 mt-2 right-0 rounded-md border border-gray-700 bg-gray-800 shadow-lg overflow-hidden min-w-max"
                      >
                        <button
                          onClick={() => {
                            startEdit(e.playerId, e.machineName, e.entry);
                            setOpenMenuKey(null);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-700 flex items-center gap-2"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-blue-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden
                          >
                            <path d="M17.414 2.586a2 2 0 010 2.828l-9.9 9.9a1 1 0 01-.465.263l-4 1a1 1 0 01-1.213-1.213l1-4a1 1 0 01.263-.465l9.9-9.9a2 2 0 012.828 0z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            requestDeleteScore(e.playerId, e.machineName, e.entry);
                            setOpenMenuKey(null);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-700 flex items-center gap-2"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-red-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 011.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Edit Score Modal */}
      {editingScore && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-amber-400 mb-4">Edit Score</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-200 text-sm font-medium mb-2">Score</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={editingScore.newScoreDisplay}
                  onChange={(e) => {
                    const formatted = formatScore(e.target.value);
                    setEditingScore({
                      ...editingScore,
                      newScoreDisplay: formatted,
                      newScore: Number(formatted.replace(/\D/g, "")) || 0,
                    });
                  }}
                  className="w-full p-2 rounded-lg bg-gray-700 text-white"
                />
              </div>

              <div>
                <label className="block text-gray-200 text-sm font-medium mb-2">Date & Time</label>
                <input
                  type="datetime-local"
                  value={editingScore.newDateTime}
                  onChange={(e) =>
                    setEditingScore({
                      ...editingScore,
                      newDateTime: e.target.value,
                    })
                  }
                  className="w-full p-2 rounded-lg bg-gray-700 text-white [color-scheme:dark]"
                  style={{
                    colorScheme: "dark",
                  }}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={saveEdit}
                className="flex-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2"
              >
                Save
              </button>
              <button
                onClick={() => setEditingScore(null)}
                className="flex-1 rounded bg-gray-700 hover:bg-gray-600 text-white px-4 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <PasswordModal
        isOpen={!!deleteModal}
        title="Enter Password to Delete Score"
        onConfirm={confirmDeleteScore}
        onCancel={() => setDeleteModal(null)}
        confirmText="Delete Score"
      />
    </>
  );
}
