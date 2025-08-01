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

export default function ScoresByMachine() {
  const { db } = getFirebase();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [machine, setMachine] = useState("");

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
        setPlayers(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      }
    );
    return () => {
      unsubM();
      unsubP();
    };
  }, [db]);

  const scores = players.flatMap((p) => {
    const list = p.scores?.[machine] || [];
    return list.map((s) => ({ player: p.name, score: s }));
  });
  scores.sort((a, b) => b.score - a.score);

  const mInfo = machines.find((m) => m.name === machine);

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-amber-400">
        High Scores by Machine
      </h2>
      <select
        className="w-full p-2 rounded-lg bg-gray-700 mb-6"
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
                {machine} – High Scores
              </h3>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-700">
                  <th className="p-3">Rank</th>
                  <th className="p-3">Player</th>
                  <th className="p-3 text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {scores.map((s, i) => (
                  <tr
                    key={i}
                    className={i % 2 ? "bg-gray-700/50" : "bg-gray-800/50"}
                  >
                    <td className="pl-6 font-bold ml-2">{i + 1}</td>
                    <td className="p-3">{s.player}</td>
                    <td className="p-3 text-right font-dotmatrix text-[51px] text-amber-300">
                      {s.score.toLocaleString()}
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
