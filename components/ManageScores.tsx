import { useState } from "react";
import { doc, updateDoc, arrayRemove, arrayUnion, deleteField } from "firebase/firestore";
import { getFirebase } from "@/lib/firebase";
import Toast from "./ui/Toast";
import FormContainer from "./ui/FormContainer";
import PlayerScoreSection from "./ui/PlayerScoreSection";
import Button from "./ui/Button";
import PasswordModal from "./ui/PasswordModal";
import { ScoreEntry } from "../types/types";
import { useFirebaseData } from "../hooks/useFirebaseData";
import { formatScore } from "../utils/scoreUtils";


export default function ManageScores() {
  const { db } = getFirebase();
  const { machines, players } = useFirebaseData();
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
  const [deleteModal, setDeleteModal] = useState<{
    playerId: string;
    machineName: string;
    score: ScoreEntry;
  } | null>(null);

  const handleScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatScore(e.target.value);
    if (editingScore) {
      setEditingScore({
        ...editingScore,
        newScoreDisplay: formatted,
        newScore: Number(formatted.replace(/\D/g, "")) || 0,
      });
    }
  };

  function requestDeleteScore(playerId: string, machineName: string, score: ScoreEntry) {
    setDeleteModal({ playerId, machineName, score });
  }

  async function confirmDeleteScore() {
    if (!deleteModal) return;

    try {
      const player = players.find(p => p.id === deleteModal.playerId);
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
      <FormContainer title="Manage Scores">
        {players.length === 0 ? (
          <p className="text-gray-400">No players found.</p>
        ) : (
          <div className="space-y-8">
            {players.map((player) => (
              <PlayerScoreSection
                key={player.id}
                player={player}
                machines={machines}
                showActions
                onEditScore={startEdit}
                onDeleteScore={requestDeleteScore}
              />
            ))}
          </div>
        )}
      </FormContainer>

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
                  onChange={handleScoreChange}
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
              <Button variant="success" className="flex-1" onClick={saveEdit}>
                Save
              </Button>
              <Button variant="cancel" className="flex-1" onClick={() => setEditingScore(null)}>
                Cancel
              </Button>
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
