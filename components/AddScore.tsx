import { FormEvent, useEffect, useState } from "react";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import Toast from "./ui/Toast";
import FormContainer from "./ui/FormContainer";
import Input from "./ui/Input";
import Select from "./ui/Select";
import Button from "./ui/Button";
import { useFirebaseData } from "../hooks/useFirebaseData";
import { handleScoreChange } from "../utils/scoreUtils";
import { getFirebase } from "@/lib/firebase";

export default function AddScore() {
  const { db } = getFirebase();
  const { machines, players } = useFirebaseData();
  const [machine, setMachine] = useState("");
  const [player, setPlayer] = useState("");
  const [score, setScore] = useState("");
  const [toast, setToast] = useState<{
    msg: string;
    type?: "success" | "error";
  }>({ msg: "" });

  useEffect(() => {
    if (!machine && machines.length > 0) {
      setMachine(machines[0].name);
    }
  }, [machines, machine]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!machine || !player || !score) return;
    try {
      const numericScore = Number(score.replace(/\D/g, ""));
      await updateDoc(doc(db, "data/players/players", player), {
        [`scores.${machine}`]: arrayUnion({
          score: numericScore,
          timestamp: new Date().toISOString(),
        }),
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
      <Toast message={toast.msg} type={toast.type} clear={() => setToast({ msg: "" })} />
      <FormContainer title="Add a High Score" className="max-w-lg mx-auto">
        <form onSubmit={onSubmit}>
          <Select
            label="Machine"
            value={machine}
            onChange={(e) => setMachine(e.target.value)}
            options={machines.map((m) => ({ value: m.name, label: m.name }))}
            placeholder="-- select --"
            required
          />
          <Select
            label="Player"
            value={player}
            onChange={(e) => setPlayer(e.target.value)}
            options={players.map((p) => ({ value: p.id, label: p.name }))}
            placeholder="-- select --"
            required
          />
          <Input label="Score" type="text" inputMode="numeric" value={score} onChange={(e) => handleScoreChange(e, setScore)} required />
          <Button type="submit" size="lg">
            Add Score
          </Button>
        </form>
      </FormContainer>
    </>
  );
}
