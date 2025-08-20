import { FormEvent, useState } from "react";
import { collection, addDoc, doc, updateDoc, getDocs, deleteDoc } from "firebase/firestore";
import { getFirebase } from "@/lib/firebase";
import Button from "@/components/ui/Button";
import DeleteButton from "@/components/ui/DeleteButton";
import FormContainer from "@/components/ui/FormContainer";
import Input from "@/components/ui/Input";
import MachineInfo from "@/components/ui/MachineInfo";
import Toast from "@/components/ui/Toast";
import { useFirebaseData } from "@/hooks/useFirebaseData";

export default function ManageMachines() {
  const { db } = getFirebase();
  const { machines } = useFirebaseData();
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editName, setEditName] = useState("");
  const [editImage, setEditImage] = useState("");
  const [toast, setToast] = useState<{
    msg: string;
    type?: "success" | "error";
  }>({ msg: "" });

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
        const playersSnapshot = await getDocs(collection(db, "data/players/players"));
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
              }),
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

  async function deleteMachine(id: string, name: string) {
    try {
      await deleteDoc(doc(db, "data/machines/machines", id));

      const playersSnapshot = await getDocs(collection(db, "data/players/players"));
      const updates: Promise<void>[] = [];

      playersSnapshot.docs.forEach((playerDoc) => {
        const playerData = playerDoc.data();
        if (playerData.scores && playerData.scores[name]) {
          const newScores = { ...playerData.scores };
          delete newScores[name];
          updates.push(
            updateDoc(doc(db, "data/players/players", playerDoc.id), {
              scores: newScores,
            }),
          );
        }
      });

      if (updates.length > 0) {
        await Promise.all(updates);
      }

      setToast({ msg: "Machine deleted!" });
    } catch (err) {
      console.error(err);
      setToast({ msg: "Error deleting machine", type: "error" });
    }
  }

  return (
    <>
      <Toast message={toast.msg} type={toast.type} clear={() => setToast({ msg: "" })} />

      <FormContainer title="Add a New Pinball Machine" className="max-w-lg mx-auto">
        <form onSubmit={onSubmit}>
          <Input label="Machine Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Image URL (optional)" value={image} onChange={(e) => setImage(e.target.value)} />
          <Button type="submit" size="lg">
            Add Machine
          </Button>
        </form>
      </FormContainer>

      <FormContainer title="Edit Machines" className="max-w-lg mx-auto mt-6">
        <div className="space-y-3">
          {machines.map((m) => (
            <div key={m.id} className="bg-gray-700 p-3 rounded">
              {editingId === m.id ? (
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
                    <Button variant="success" size="sm" onClick={() => saveEdit(m.id)}>
                      Save
                    </Button>
                    <Button variant="cancel" size="sm" onClick={() => setEditingId("")}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <MachineInfo machine={m} showUrl />
                  </div>
                  <Button
                    variant="edit"
                    size="sm"
                    className="flex-shrink-0"
                    onClick={() => {
                      setEditingId(m.id);
                      setEditName(m.name);
                      setEditImage(m.image || "");
                    }}
                  >
                    Edit
                  </Button>
                  <DeleteButton
                    onDelete={() => deleteMachine(m.id, m.name)}
                    itemName={m.name}
                    itemType="machine"
                    className="flex-shrink-0"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </FormContainer>
    </>
  );
}
