import { FormEvent, useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import Toast from "./Toast";
import { getFirebase } from "@/lib/firebase";

export default function AddMachine() {
  const { db } = getFirebase();
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
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

  return (
    <>
      <Toast
        message={toast.msg}
        type={toast.type}
        clear={() => setToast({ msg: "" })}
      />
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
    </>
  );
}
