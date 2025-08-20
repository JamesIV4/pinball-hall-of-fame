import { useEffect, useState } from "react";
import Home from "@/components/pages/Home";
import AddScore from "@/components/pages/scores/AddScore";
import ManageScores from "@/components/pages/manage/ManageScores";
import HighScores from "@/components/pages/scores/HighScores";
import PlayerStats from "@/components/pages/scores/PlayerStats";
import AllRecentScores from "@/components/pages/scores/AllRecentScores";
import ManageDatabase from "@/components/pages/manage/ManageDatabase";
import { View } from "../types/types";
import NavBar from "@/components/ui/NavBar";
import ManagePlayers from "@/components/pages/manage/ManagePlayers";
import ManageMachines from "@/components/pages/manage/ManageMachines";
import ComparePlayers from "@/components/pages/scores/ComparePlayers";
import { useFirebaseData } from "../hooks/useFirebaseData";

export default function IndexPage() {
  const [view, setView] = useState<View>("home");
  const { machines, players } = useFirebaseData();

  // Initialize view from URL on mount
  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.slice(1) as View;
      if (
        hash &&
        [
          "home",
          "manageMachines",
          "managePlayers",
          "addScore",
          "manageScores",
          "highScores",
          "highScoresWeekly",
          "allRecentScores",
          "playerStats",
          "comparePlayers",
          "manageDatabase",
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

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {view !== "home" && (
        <header className="text-center mb-6">
          <h1 className="text-4xl font-bold text-amber-400 tracking-wider">Pinball Hall of Fame</h1>
          <p className="text-gray-400">Track your high scores and dominate the silver ball!</p>
        </header>
      )}

      <NavBar view={view} setView={navigateToView} />

      {view === "home" && <Home players={players} machines={machines} setView={navigateToView} />}
      {view === "manageMachines" && <ManageMachines />}
      {view === "managePlayers" && <ManagePlayers />}
      {view === "addScore" && <AddScore />}
      {view === "manageScores" && <ManageScores />}
      {view === "highScores" && <HighScores onNavigate={navigateToView} />}
      {view === "highScoresWeekly" && <HighScores initialViewMode="weekly" onNavigate={navigateToView} />}
      {view === "allRecentScores" && <AllRecentScores />}
      {view === "playerStats" && <PlayerStats />}
      {view === "comparePlayers" && <ComparePlayers />}
      {view === "manageDatabase" && <ManageDatabase />}
    </div>
  );
}
