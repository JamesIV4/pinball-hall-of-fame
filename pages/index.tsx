import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import NavBar from "../components/NavBar";
import Home from "../components/Home";
import AddMachine from "../components/AddMachine";
import AddPlayer from "../components/AddPlayer";
import AddScore from "../components/AddScore";
import ManageScores from "../components/ManageScores";
import HighScores from "../components/HighScores";
import ScoresByPlayer from "../components/ScoresByPlayer";
import AllScores from "../components/AllScores";
import { getFirebase } from "@/lib/firebase";

export default function IndexPage() {
  type View = Parameters<typeof NavBar>[0]["view"];
  const [view, setView] = useState<View>("home");
  const { db } = getFirebase();
  const [machineCount, setMachineCount] = useState(0);
  const [playerCount, setPlayerCount] = useState(0);

  // counts realtime
  useEffect(() => {
    const unsubM = onSnapshot(
      collection(db, "data/machines/machines"),
      (snap) => setMachineCount(snap.size)
    );
    const unsubP = onSnapshot(collection(db, "data/players/players"), (snap) =>
      setPlayerCount(snap.size)
    );
    return () => {
      unsubM();
      unsubP();
    };
  }, [db]);

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <header className="text-center mb-6">
        <h1 className="text-4xl font-bold text-amber-400 tracking-wider">
          Pinball Hall of Fame
        </h1>
        <p className="text-gray-400">
          Track your high scores and dominate the silver ball!
        </p>
      </header>

      <NavBar view={view} setView={setView} />

      {view === "home" && (
        <Home totalMachines={machineCount} totalPlayers={playerCount} />
      )}
      {view === "addMachine" && <AddMachine />}
      {view === "addPlayer" && <AddPlayer />}
      {view === "addScore" && <AddScore />}
      {view === "manageScores" && <ManageScores />}
      {view === "highScores" && <HighScores />}
      {view === "scoresByPlayer" && <ScoresByPlayer />}
      {view === "allScores" && <AllScores />}
    </div>
  );
}
