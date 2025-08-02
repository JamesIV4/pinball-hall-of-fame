import { FormEvent, useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import Toast from "./Toast";
import { getFirebase } from "@/lib/firebase";

interface Machine {
  id: string;
  name: string;
}
interface Player {
  id: string;
  name: string;
}

export default function AddScore() {
  const { db } = getFirebase();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [machine, setMachine] = useState("");
  const [player, setPlayer] = useState("");
  const [score, setScore] = useState("");
  const [toast, setToast] = useState<{
    msg: string;
    type?: "success" | "error";
  }>({ msg: "" });

  // realtime listeners
  useEffect(() => {
    const unsubMachines = onSnapshot(
      collection(db, "data/machines/machines"),
      (snap) => {
        setMachines(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      }
    );
    const unsubPlayers = onSnapshot(
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
      unsubMachines();
      unsubPlayers();
    };
  }, [db]);

  useEffect(() => {
    // If nothing is selected yet and we have at least one machine,
    // pre-select the first one.
    if (!machine && machines.length > 0) {
      setMachine(machines[0].name);
    }
  }, [machines, machine]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!machine || !player || !score) return;
    try {
      await updateDoc(doc(db, "data/players/players", player), {
        [`scores.${machine}`]: arrayUnion(Number(score)),
      });
      setToast({ msg: "Score added!" });
      setMachine("");
      setPlayer("");
      setScore("");
    } catch (err) {
      console.error(err);
      setToast({ msg: "Error adding score", type: "error" });
    }
  }

  return (
    <>
      <Toast
        message={toast.msg}
        type={toast.type}
        clear={() => setToast({ msg: "" })}
      />
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-lg mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-amber-400">
          Add a High Score
        </h2>
        <form onSubmit={onSubmit}>
          <div className="mb-4">
            <label className="block mb-2">Machine</label>
            <select
              className="w-full p-2 rounded-lg bg-gray-700"
              value={machine}
              onChange={(e) => setMachine(e.target.value)}
              required
            >
              <option value="">-- select --</option>
              {machines.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block mb-2">Player</label>
            <select
              className="w-full p-2 rounded-lg bg-gray-700"
              value={player}
              onChange={(e) => setPlayer(e.target.value)}
              required
            >
              <option value="">-- select --</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block mb-2">Score</label>
            <input
              type="number"
              className="w-full p-2 rounded-lg bg-gray-700"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              required
            />
          </div>
          <button className="w-full bg-amber-500 text-black font-bold py-2 rounded-lg hover:bg-amber-600">
            Add Score
          </button>
        </form>
      </div>
    </>
  );
}
