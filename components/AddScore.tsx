import { FormEvent, useEffect, useRef, useState } from "react";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import Toast from "./ui/Toast";
import FormContainer from "./ui/FormContainer";
import Input from "./ui/Input";
import Select from "./ui/Select";
import Button from "./ui/Button";
import { useFirebaseData } from "../hooks/useFirebaseData";
import { handleScoreChange } from "../utils/scoreUtils";
import { safeGetItem, safeSetItem, safeRemoveItem } from "../utils/storage";
import { getFirebase } from "@/lib/firebase";

export default function AddScore() {
  const { db } = getFirebase();
  const { machines, players } = useFirebaseData();
  const [machine, setMachine] = useState("");
  const [player, setPlayer] = useState("");
  const [score, setScore] = useState("");
  const scoreRef = useRef<HTMLInputElement | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type?: "success" | "error";
  }>({ msg: "" });

  // Default machine to last used (if available), otherwise first available.
  useEffect(() => {
    if (!machine && machines.length > 0) {
      const last = safeGetItem("phof_last_machine");
      if (last && machines.some((m) => m.name === last)) {
        setMachine(last);
        return;
      }
      setMachine(machines[0].name);
    }
  }, [machines, machine]);

  // Prefill player from localStorage (set by other pages via phof_prefill_player), or from last-used.
  useEffect(() => {
    if (!player) {
      const prefill = safeGetItem("phof_prefill_player");
      if (prefill && players.some((p) => p.id === prefill)) {
        setPlayer(prefill);
        safeRemoveItem("phof_prefill_player");
        return;
      }

      const last = safeGetItem("phof_last_player");
      if (last && players.some((p) => p.id === last)) {
        setPlayer(last);
        return;
      }
    }
  }, [players, player]);

  // Focus the score input once machine & player are available
  useEffect(() => {
    if (typeof window !== "undefined" && scoreRef.current) {
      if (machine && player) {
        scoreRef.current.focus();
      }
    }
  }, [machine, player]);

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
      // Remember last machine/player and only clear the score input
      safeSetItem("phof_last_machine", machine);
      safeSetItem("phof_last_player", player);
      setScore("");
      // refocus the score input
      scoreRef.current?.focus();
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
          <Input
            ref={scoreRef}
            id="score-input"
            label="Score"
            type="text"
            inputMode="numeric"
            value={score}
            onChange={(e) => handleScoreChange(e, setScore)}
            required
          />
          <Button type="submit" size="lg">
            Add Score
          </Button>
        </form>
      </FormContainer>
    </>
  );
}
