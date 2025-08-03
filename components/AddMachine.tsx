import { FormEvent, useState, useEffect } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  getDocs,
} from "firebase/firestore";
import Toast from "./Toast";
import { getFirebase } from "@/lib/firebase";

interface Machine {
  id: string;
  name: string;
  image?: string;
}

export default function AddMachine() {
  const { db } = getFirebase();
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [machines, setMachines] = useState<Machine[]>([]);
  const [editingId, setEditingId] = useState("");
  const [editName, setEditName] = useState("");
  const [editImage, setEditImage] = useState("");
  const [toast, setToast] = useState<{ msg: string; type?: "success" | "error" }>(
    { msg: "" }
  );

  useEffect(() => {
    const unsubM = onSnapshot(
      collection(db, "data/machines/machines"),
      (snap) => {
        const machineList = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        machineList.sort((a, b) => a.name.localeCompare(b.name));
        setMachines(machineList);
      }
    );
    return () => unsubM();
  }, [db]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await addDoc(collection(db, "data/machines/machines"), { name, image });
      setToast({ msg: "Machine added!" });
      setName("");
      setImage("");
    } catch (err) {
      console.error(err);
      setToast({ msg: "Error adding machine", type: "error" });
    }
  }

  async function saveEdit(id: string) {
    const oldMachine = machines.find((m) => m.id === id);
    const oldName = oldMachine?.name;

    try {
      await updateDoc(doc(db, "data/machines/machines", id), {
        name: editName,
        image: editImage,
      });

      if (oldName && oldName !== editName) {
        const playersSnapshot = await getDocs(
          collection(db, "data/players/players")
        );
        const updates: Promise<void>[] = [];

        playersSnapshot.docs.forEach((playerDoc) => {
          const playerData = playerDoc.data();
          if (playerData.scores && playerData.scores[oldName]) {
            const newScores = { ...playerData.scores };
            newScores[editName] = newScores[oldName];
            delete newScores[oldName];
            updates.push(
              updateDoc(doc(db, "data/players/players", playerDoc.id), {
                scores: newScores,
              })
            );
          }
        });

        if (updates.length > 0) {
          await Promise.all(updates);
        }
      }

      setEditingId("");
      setToast({ msg: "Machine updated!" });
    } catch (err) {
      console.error(err);
      setToast({ msg: "Error updating machine", type: "error" });
    }
  }

  return (
    <>
      <Toast
        message={toast.msg}
        type={toast.type}
        clear={() => setToast({ msg: "" })}
      />

      {/* Add Machine Form */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-lg mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-amber-400">
          Add a New Pinball Machine
        </h2>
        <form onSubmit={onSubmit}>
          <div className="mb-4">
            <label className="block mb-2">Machine Name</label>
            <input
              className="w-full p-2 rounded-lg bg-gray-700"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2">Image URL (optional)</label>
            <input
              className="w-full p-2 rounded-lg bg-gray-700"
              value={image}
              onChange={(e) => setImage(e.target.value)}
            />
          </div>
          <button className="w-full bg-amber-500 text-black font-bold py-2 rounded-lg hover:bg-amber-600">
            Add Machine
          </button>
        </form>
      </div>

      {/* Edit Machines */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-lg mx-auto mt-6">
        <h2 className="text-2xl font-bold mb-4 text-amber-400">Edit Machines</h2>
        <div className="space-y-3">
          {machines.map((m) => (
            <div key={m.id} className="bg-gray-700 p-3 rounded">
              {editingId === m.id ? (
                /* Edit mode */
                <div className="space-y-2">
                  <input
                    className="w-full p-2 rounded bg-gray-600"
                    placeholder="Machine Name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                  <input
                    className="w-full p-2 rounded bg-gray-600"
                    placeholder="Image URL (optional)"
                    value={editImage}
                    onChange={(e) => setEditImage(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                      onClick={() => saveEdit(m.id)}
                    >
                      Save
                    </button>
                    <button
                      className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                      onClick={() => setEditingId("")}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <div className="flex items-center gap-3">
                  {m.image && (
                    <img
                      src={m.image}
                      alt={m.name}
                      className="w-12 h-16 object-cover rounded"
                    />
                  )}

                  {/* min-w-0 enables truncate to actually work */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate" title={m.name}>
                      {m.name}
                    </div>
                    {m.image && (
                      <div
                        className="text-xs text-gray-400 truncate"
                        title={m.image}
                      >
                        {m.image}
                      </div>
                    )}
                  </div>

                  <button
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    onClick={() => {
                      setEditingId(m.id);
                      setEditName(m.name);
                      setEditImage(m.image || "");
                    }}
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
