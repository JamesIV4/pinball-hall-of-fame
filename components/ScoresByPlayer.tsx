import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { getFirebase } from "@/lib/firebase";

interface Machine {
  id: string;
  name: string;
  image?: string;
}

interface Player {
  id: string;
  name: string;
  scores?: Record<string, number[]>;
}

export default function ScoresByPlayer() {
  const { db } = getFirebase();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerId, setPlayerId] = useState("");

  // Fetch machines and players in real time
  useEffect(() => {
    const unsubM = onSnapshot(
      collection(db, "data/machines/machines"),
      (snap) =>
        setMachines(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
    );
    const unsubP = onSnapshot(
      collection(db, "data/players/players"),
      (snap) =>
        setPlayers(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
    );
    return () => {
      unsubM();
      unsubP();
    };
  }, [db]);

  // --- NEW: default to the first player once the list is available ---
  useEffect(() => {
    if (!playerId && players.length) {
      setPlayerId(players[0].id);
    }
  }, [players, playerId]);
  // ------------------------------------------------------------------

  const player = players.find((p) => p.id === playerId);
  const machineNames = Object.keys(player?.scores || {}).sort();

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-amber-400">
        High Scores by Player
      </h2>

      <select
        className="w-full p-2 rounded-lg bg-gray-700 mb-6"
        value={playerId}
        onChange={(e) => setPlayerId(e.target.value)}
      >
        <option value="">-- select --</option>
        {players.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      {playerId &&
        (!machineNames.length ? (
          <p className="text-gray-400">
            No scores recorded for {player?.name} yet.
          </p>
        ) : (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-amber-300">
              Scores for {player?.name}
            </h3>
            {machineNames.map((mName) => {
              const mInfo = machines.find((m) => m.name === mName);
              const scores = [...(player?.scores?.[mName] || [])].sort(
                (a, b) => b - a
              );
              return (
                <div key={mName} className="bg-gray-700 p-4 rounded-lg">
                  <div className="flex items-center mb-3">
                    {mInfo?.image && (
                      <img
                        src={mInfo.image}
                        alt={mName}
                        className="w-16 h-20 object-cover rounded-md mr-4"
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
                        <span className="font-dotmatrix text-[23px] md:text-[51px] text-amber-300">
                          {s.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
    </div>
  );
}
