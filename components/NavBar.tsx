import { Dispatch, SetStateAction } from "react";

type View =
  | "home"
  | "addMachine"
  | "addPlayer"
  | "addScore"
  | "scoresByMachine"
  | "scoresByPlayer"
  | "allScores";

interface Props {
  view: View;
  setView: Dispatch<SetStateAction<View>>;
}

export default function NavBar({ view, setView }: Props) {
  const btn = (id: View, icon: string, label: string) => (
    <button
      onClick={() => setView(id)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors hover:bg-amber-500 hover:text-black ${
        view === id ? "bg-amber-400 text-black" : ""
      }`}
    >
      <i className={`fas fa-${icon}`} /> {label}
    </button>
  );

  return (
    <nav className="mb-8 space-y-2">
      <div className="flex justify-center">
        {btn("home", "home", "Home")}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {btn("addMachine", "gamepad", "Machines")}
        {btn("addPlayer", "user-plus", "Players")}
        {btn("addScore", "star", "Add Score")}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {btn("scoresByMachine", "trophy", "Scores by Machine")}
        {btn("scoresByPlayer", "user-astronaut", "Scores by Player")}
        {btn("allScores", "list", "All Scores")}
      </div>
    </nav>
  );
}
