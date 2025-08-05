import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  arrayRemove,
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
                              <div
                                key={i}
                                className="flex items-center justify-between"
                              >
                                <div className="flex items-center">
                                  <span className="md:text-[23px] font-bold mr-3 w-6 ml-2">
                                    {i + 1}.
                                  </span>
                                  <ScoreWithTooltip score={s} />
                                </div>
                                <button
                                  onClick={() =>
                                    deleteScore(player.id, mName, s)
                                  }
                                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-semibold transition-colors"
                                >
                                  Delete
                                </button>
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
    </>
  );
}
