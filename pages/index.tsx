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
import { View } from "../types/types";

export default function IndexPage() {
  const [view, setView] = useState<View>("home");
  const { db } = getFirebase();
  const [machineCount, setMachineCount] = useState(0);
  const [playerCount, setPlayerCount] = useState(0);

  // Initialize view from URL on mount
  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.slice(1) as View;
      if (
        hash &&
        [
          "home",
          "addMachine",
          "addPlayer",
          "addScore",
          "manageScores",
          "highScores",
          "highScoresWeekly",
          "scoresByPlayer",
          "allScores",
        ].includes(hash)
      ) {
        setView(hash);
      } else {
        setView("home");
      }
    };

    // Set initial view from URL
    handlePopState();

    // Listen for browser back/forward
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Enhanced setView that updates browser history
  const navigateToView = (newView: View | ((prevState: View) => View)) => {
    const resolvedView = typeof newView === "function" ? newView(view) : newView;
    if (resolvedView !== view) {
      window.history.pushState(null, "", `#${resolvedView}`);
      setView(resolvedView);
    }
  };

  // counts realtime
  useEffect(() => {
    const unsubM = onSnapshot(collection(db, "data/machines/machines"), (snap) => setMachineCount(snap.size));
    const unsubP = onSnapshot(collection(db, "data/players/players"), (snap) => setPlayerCount(snap.size));
    return () => {
      unsubM();
      unsubP();
    };
  }, [db]);

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <header className="text-center mb-6">
        <h1 className="text-4xl font-bold text-amber-400 tracking-wider">Pinball Hall of Fame</h1>
        <p className="text-gray-400">Track your high scores and dominate the silver ball!</p>
      </header>

      <NavBar view={view} setView={navigateToView} />

      {view === "home" && <Home totalMachines={machineCount} totalPlayers={playerCount} setView={navigateToView} />}
      {view === "addMachine" && <AddMachine />}
      {view === "addPlayer" && <AddPlayer />}
      {view === "addScore" && <AddScore />}
      {view === "manageScores" && <ManageScores />}
      {view === "highScores" && <HighScores />}
      {view === "highScoresWeekly" && <HighScores initialViewMode="weekly" />}
      {view === "scoresByPlayer" && <ScoresByPlayer />}
      {view === "allScores" && <AllScores />}
    </div>
  );
}
