import { useMemo, useState } from "react";
import { doc, updateDoc, arrayRemove, arrayUnion, deleteField } from "firebase/firestore";
import { getFirebase } from "@/lib/firebase";
import Toast from "./ui/Toast";
import PasswordModal from "./ui/PasswordModal";
import { ScoreEntry } from "../types/types";
import { useFirebaseData } from "../hooks/useFirebaseData";
import { formatScore } from "../utils/scoreUtils";
import ListHeader, { TimeFilter } from "./ui/ListHeader";
import RecentEventList, { RecentEventItem } from "./ui/RecentEventList";

type RecentEvent = RecentEventItem;

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
  // actions handled within RecentEventList mobile menu

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
        <ListHeader
          title="Manage Scores"
          count={filtered.length}
          timeFilter={timeFilter}
          onTimeFilterChange={setTimeFilter}
          search={search}
          onSearchChange={setSearch}
          placeholder="Search by player, machine, or score..."
        />

        <RecentEventList
          items={filtered}
          showActions
          onEdit={(e) => startEdit(e.playerId, e.machineName, e.entry)}
          onDelete={(e) => requestDeleteScore(e.playerId, e.machineName, e.entry)}
        />
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
