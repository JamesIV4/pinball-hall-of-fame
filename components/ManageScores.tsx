import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  arrayRemove,
  arrayUnion,
} from "firebase/firestore";
import { getFirebase } from "@/lib/firebase";
import Toast from "./Toast";
import { Machine, Player, ScoreEntry } from "../types/types";
import ScoreWithTooltip from "./ScoreWithTooltip";

export default function ManageScores() {
  const { db } = getFirebase();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [toast, setToast] = useState<{
    msg: string;
    type?: "success" | "error";
  }>({ msg: "" });
  const [editingScore, setEditingScore] = useState<{
    playerId: string;
    machineName: string;
    originalScore: ScoreEntry;
    newScore: number;
    newScoreDisplay: string;
    newDateTime: string;
  } | null>(null);

  // Format number with commas for display
  const formatScore = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "");
    // Add commas
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Handle score input change with formatting
  const handleScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatScore(e.target.value);
    if (editingScore) {
      setEditingScore({
        ...editingScore,
        newScoreDisplay: formatted,
        newScore: Number(formatted.replace(/\D/g, "")) || 0
      });
    }
  };

  useEffect(() => {
    const unsubM = onSnapshot(
      collection(db, "data/machines/machines"),
      (snap) => {
        setMachines(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      }
    );
    const unsubP = onSnapshot(
      collection(db, "data/players/players"),
      (snap) => {
        setPlayers(
          snap.docs
            .map((d) => ({ id: d.id, ...(d.data() as any) }))
            .sort((a, b) => a.name.localeCompare(b.name))
        );
      }
    );
    return () => {
      unsubM();
      unsubP();
    };
  }, [db]);

  async function deleteScore(
    playerId: string,
    machineName: string,
    score: ScoreEntry
  ) {
    try {
      await updateDoc(doc(db, "data/players/players", playerId), {
        [`scores.${machineName}`]: arrayRemove(score),
      });
      setToast({ msg: "Score deleted!" });
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
      newDateTime: dateTime
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
        timestamp: new Date(newDateTime).toISOString()
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
      <Toast
        message={toast.msg}
        type={toast.type}
        clear={() => setToast({ msg: "" })}
      />
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-amber-400">
          Manage Scores
        </h2>

        {players.length === 0 ? (
          <p className="text-gray-400">No players found.</p>
        ) : (
          <div className="space-y-8">
            {players.map((player) => {
              const machineNames = Object.keys(player.scores || {}).sort();

              if (machineNames.length === 0) {
                return (
                  <div key={player.id} className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-xl font-bold text-amber-300 mb-2">
                      {player.name}
                    </h3>
                    <p className="text-gray-400">No scores recorded yet.</p>
                  </div>
                );
              }

              return (
                <div key={player.id} className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-xl font-bold text-amber-300 mb-4">
                    {player.name}
                  </h3>
                  <div className="space-y-4">
                    {machineNames.map((mName) => {
                      const mInfo = machines.find((m) => m.name === mName);
                      const scores = [...(player.scores?.[mName] || [])].sort(
                        (a, b) => b.score - a.score
                      );
                      return (
                        <div key={mName} className="bg-gray-600 p-3 rounded-lg">
                          <div className="flex items-center mb-3">
                            {mInfo?.image && (
                              <img
                                src={mInfo.image}
                                alt={mName}
                                className="w-12 h-16 object-cover rounded-md mr-3"
                              />
                            )}
                            <h4 className="text-lg font-semibold text-amber-200">
                              {mName}
                            </h4>
                          </div>
                          <div className="space-y-1">
                            {scores.map((s, i) => (
                              <div key={i} className="flex items-center">
                                <span className="md:text-[23px] font-bold mr-3 w-6 ml-2">
                                  {i + 1}.
                                </span>
                                <ScoreWithTooltip score={s} />
                                {s.timestamp && (
                                  <>
                                    <div className="flex-1 h-px bg-gray-500 mx-3"></div>
                                    <span className="text-gray-400 text-sm whitespace-nowrap">
                                      {new Date(s.timestamp).toLocaleString(undefined, {
                                        year: 'numeric',
                                        month: 'numeric',
                                        day: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </>
                                )}
                                <div className="flex gap-2 ml-4">
                                  <button
                                    onClick={() => startEdit(player.id, mName, s)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-semibold transition-colors"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => deleteScore(player.id, mName, s)}
                                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-semibold transition-colors"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Edit Score Modal */}
      {editingScore && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-amber-400 mb-4">Edit Score</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-200 text-sm font-medium mb-2">
                  Score
                </label>
                <input
                  type="text"
                  value={editingScore.newScoreDisplay}
                  onChange={handleScoreChange}
                  className="w-full p-2 rounded-lg bg-gray-700 text-white"
                />
              </div>
              
              <div>
                <label className="block text-gray-200 text-sm font-medium mb-2">
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={editingScore.newDateTime}
                  onChange={(e) => setEditingScore({
                    ...editingScore,
                    newDateTime: e.target.value
                  })}
                  className="w-full p-2 rounded-lg bg-gray-700 text-white [color-scheme:dark]"
                  style={{
                    colorScheme: 'dark'
                  }}
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={saveEdit}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setEditingScore(null)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
