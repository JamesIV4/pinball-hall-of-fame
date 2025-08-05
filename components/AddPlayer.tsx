import { FormEvent, useState, useEffect } from "react";
import Toast from "./Toast";
import { getFirebase } from "@/lib/firebase";
import { addDoc, collection, onSnapshot, doc, updateDoc } from "firebase/firestore";

interface ScoreEntry {
  score: number;
  timestamp?: string;
}

interface Player {
  id: string;
  name: string;
  scores?: Record<string, (number | ScoreEntry)[]>;
}

export default function AddPlayer() {
  const { db } = getFirebase();
  const [name, setName] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [editingId, setEditingId] = useState("");
  const [editName, setEditName] = useState("");
  const [toast, setToast] = useState<{
    msg: string;
    type?: "success" | "error";
  }>({ msg: "" });

  useEffect(() => {
    const unsubP = onSnapshot(collection(db, "data/players/players"), (snap) => {
      setPlayers(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })).sort((a, b) => a.name.localeCompare(b.name)),
      );
    });
    return () => unsubP();
  }, [db]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await addDoc(collection(db, "data/players/players"), {
        name,
        scores: {},
      });
      setToast({ msg: "Player added!" });
      setName("");
    } catch (err) {
      console.error(err);
      setToast({ msg: "Error adding player", type: "error" });
    }
  }

  async function saveEdit(id: string) {
    try {
      await updateDoc(doc(db, "data/players/players", id), { name: editName });
      setEditingId("");
      setToast({ msg: "Player name updated!" });
    } catch (err) {
      console.error(err);
      setToast({ msg: "Error updating player", type: "error" });
    }
  }

  return (
    <>
      <Toast message={toast.msg} type={toast.type} clear={() => setToast({ msg: "" })} />
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-lg mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-amber-400">Add a New Player</h2>
        <form onSubmit={onSubmit}>
          <div className="mb-4">
            <label className="block mb-2">Player Name</label>
            <input
              className="w-full p-2 rounded-lg bg-gray-700"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <button className="w-full bg-amber-500 text-black font-bold py-2 rounded-lg hover:bg-amber-600">
            Add Player
          </button>
        </form>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-lg mx-auto mt-6">
        <h2 className="text-2xl font-bold mb-4 text-amber-400">Edit Players</h2>
        <div className="space-y-2">
          {players.map((p) => (
            <div key={p.id} className="flex items-center gap-2 bg-gray-700 p-2 rounded">
              {editingId === p.id ? (
                <>
                  <input
                    className="flex-1 p-1 rounded bg-gray-600"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                  <button
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    onClick={() => saveEdit(p.id)}
                  >
                    Save
                  </button>
                  <button
                    className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                    onClick={() => setEditingId("")}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1">{p.name}</span>
                  <button
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    onClick={() => {
                      setEditingId(p.id);
                      setEditName(p.name);
                    }}
                  >
                    Edit
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
