import { FormEvent, useState } from "react";
import Toast from "./ui/Toast";
import FormContainer from "./ui/FormContainer";
import Input from "./ui/Input";
import Button from "./ui/Button";
import { useFirebaseData } from "../hooks/useFirebaseData";
import { getFirebase } from "@/lib/firebase";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";

export default function AddPlayer() {
  const { db } = getFirebase();
  const { players } = useFirebaseData();
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editName, setEditName] = useState("");
  const [toast, setToast] = useState<{
    msg: string;
    type?: "success" | "error";
  }>({ msg: "" });

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
      <FormContainer title="Add a New Player" className="max-w-lg mx-auto">
        <form onSubmit={onSubmit}>
          <Input label="Player Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Button type="submit" size="lg">
            Add Player
          </Button>
        </form>
      </FormContainer>

      <FormContainer title="Edit Players" className="max-w-lg mx-auto mt-6">
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
                  <Button variant="success" size="sm" onClick={() => saveEdit(p.id)}>
                    Save
                  </Button>
                  <Button variant="cancel" size="sm" onClick={() => setEditingId("")}>
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1">{p.name}</span>
                  <Button
                    variant="edit"
                    size="sm"
                    onClick={() => {
                      setEditingId(p.id);
                      setEditName(p.name);
                    }}
                  >
                    Edit
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      </FormContainer>
    </>
  );
}
