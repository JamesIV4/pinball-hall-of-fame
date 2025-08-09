import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { getFirebase } from "@/lib/firebase";
import { Machine, Player } from "../types/types";

export function useFirebaseData() {
  const { db } = getFirebase();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    const unsubM = onSnapshot(collection(db, "data/machines/machines"), (snap) => {
      const machineList = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      machineList.sort((a, b) => a.name.localeCompare(b.name));
      setMachines(machineList);
    });

    const unsubP = onSnapshot(collection(db, "data/players/players"), (snap) => {
      setPlayers(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })).sort((a, b) => a.name.localeCompare(b.name)),
      );
    });

    return () => {
      unsubM();
      unsubP();
    };
  }, [db]);

  return { machines, players };
}
