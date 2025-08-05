import { View } from "@/types/types";
import { Dispatch, SetStateAction, useRef, useEffect, MutableRefObject } from "react";

interface Props {
  view: View;
  setView: Dispatch<SetStateAction<View>>;
}

export default function NavBar({ view, setView }: Props) {
  const manageRef = useRef<HTMLDetailsElement>(null);
  const scoresRef = useRef<HTMLDetailsElement>(null);

  // Close panels when clicking outside
  useEffect(() => {
    const closeIfOutside = (e: MouseEvent) => {
      [manageRef, scoresRef].forEach((r) => {
        if (r.current?.open && !r.current.contains(e.target as Node)) {
          r.current.open = false;
        }
      });
    };
    document.addEventListener("click", closeIfOutside);
    return () => document.removeEventListener("click", closeIfOutside);
  }, []);

  const btn = (
    id: View,
    icon: string,
    label: string,
    parent?: MutableRefObject<HTMLDetailsElement | null>,
    extra = "",
  ) => (
    <button
      onClick={() => {
        setView(id);
        parent?.current && (parent.current.open = false);
      }}
      className={`nav-button flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors hover:bg-amber-500 hover:text-black ${
        view === id ? "active" : ""
      } ${extra}`}
    >
      <i className={`fas fa-${icon}`} /> {label}
    </button>
  );

  const manageViews: View[] = ["addMachine", "addPlayer", "addScore", "manageScores", "manageDatabase"];
  const scoresViews: View[] = ["highScores", "scoresByPlayer", "allScores"];

  // Shared overlay panel classes — note the new max-width
  const panelClasses =
    "absolute z-20 top-full left-1/2 -translate-x-1/2 mt-1 min-w-[10rem] max-w-[90vw] w-max flex flex-col gap-2 bg-gray-700 p-2 rounded-lg shadow-lg";

  return (
    <nav className="mb-8">
      <ul className="flex flex-wrap items-center justify-center gap-2">
        {/* Home */}
        <li>{btn("home", "home", "Home")}</li>

        {/* Manage dropdown */}
        <li className="relative">
          <details ref={manageRef} className="group">
            <summary
              className={`nav-button flex items-center justify-between px-4 py-2 rounded-lg font-semibold transition-colors hover:bg-amber-500 hover:text-black cursor-pointer select-none ${
                manageViews.includes(view) ? "active" : ""
              }`}
            >
              <span className="flex items-center">
                <i className="fas fa-wrench mr-2" />
                Manage
              </span>
              <i className="fas fa-chevron-down ml-2 transition-transform group-open:rotate-180" />
            </summary>

            <div className={panelClasses}>
              {btn("addMachine", "gamepad", "Add Machine", manageRef, "text-left")}
              {btn("addPlayer", "user-plus", "Add Player", manageRef, "text-left")}
              {btn("addScore", "star", "Add Score", manageRef, "text-left")}
              {btn("manageScores", "trash", "Manage Scores", manageRef, "text-left")}
              {btn("manageDatabase", "database", "Manage Database", manageRef, "text-left")}
            </div>
          </details>
        </li>

        {/* Scores dropdown */}
        <li className="relative">
          <details ref={scoresRef} className="group">
            <summary
              className={`nav-button flex items-center justify-between px-4 py-2 rounded-lg font-semibold transition-colors hover:bg-amber-500 hover:text-black cursor-pointer select-none ${
                scoresViews.includes(view) ? "active" : ""
              }`}
            >
              <span className="flex items-center">
                <i className="fas fa-trophy mr-2" />
                Scores
              </span>
              <i className="fas fa-chevron-down ml-2 transition-transform group-open:rotate-180" />
            </summary>

            <div className={panelClasses}>
              {btn("highScores", "trophy", "High Scores", scoresRef, "text-left")}
              {btn("scoresByPlayer", "user-astronaut", "By Player", scoresRef, "text-left")}
              {btn("allScores", "list", "All Scores", scoresRef, "text-left")}
            </div>
          </details>
        </li>
      </ul>
    </nav>
  );
}
