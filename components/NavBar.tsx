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
  const manageViews: View[] = ["addMachine", "addPlayer", "addScore"];
  const scoresViews: View[] = [
    "scoresByMachine",
    "scoresByPlayer",
    "allScores",
  ];
  const manageActive = manageViews.includes(view);
  const scoresActive = scoresViews.includes(view);

  const btn = (
    id: View,
    icon: string,
    label: string,
    extraClass = ""
  ) => (
    <button
      onClick={() => setView(id)}
      className={`nav-button flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors hover:bg-amber-500 hover:text-black ${
        view === id ? "active" : ""
      } ${extraClass}`}
    >
      <i className={`fas fa-${icon}`} /> {label}
    </button>
  );

  return (
    <nav className="mb-8">
      <ul className="flex flex-wrap items-center justify-center gap-2">
        {/* Home */}
        <li>{btn("home", "home", "Home")}</li>

        {/* Manage dropdown */}
        <li className="relative">
          <details className="group">
            <summary
              className={`nav-button flex items-center justify-between px-4 py-2 rounded-lg font-semibold transition-colors hover:bg-amber-500 hover:text-black cursor-pointer select-none ${
                manageActive ? "active" : ""
              }`}
            >
              <span className="flex items-center">
                <i className="fas fa-wrench mr-2" />
                Manage
              </span>
              <i className="fas fa-chevron-down ml-2 transition-transform group-open:rotate-180" />
            </summary>

            <div className="flex flex-col gap-2 pl-4 mt-1 md:absolute md:pl-0 md:bg-gray-800 md:p-2 md:rounded-lg md:shadow-lg md:top-full md:left-0">
              {btn("addMachine", "gamepad", "Add Machine", "text-left")}
              {btn("addPlayer", "user-plus", "Add Player", "text-left")}
              {btn("addScore", "star", "Add Score", "text-left")}
            </div>
          </details>
        </li>

        {/* Scores dropdown */}
        <li className="relative">
          <details className="group">
            <summary
              className={`nav-button flex items-center justify-between px-4 py-2 rounded-lg font-semibold transition-colors hover:bg-amber-500 hover:text-black cursor-pointer select-none ${
                scoresActive ? "active" : ""
              }`}
            >
              <span className="flex items-center">
                <i className="fas fa-trophy mr-2" />
                Scores
              </span>
              <i className="fas fa-chevron-down ml-2 transition-transform group-open:rotate-180" />
            </summary>

            <div className="flex flex-col gap-2 pl-4 mt-1 md:absolute md:pl-0 md:bg-gray-800 md:p-2 md:rounded-lg md:shadow-lg md:top-full md:left-0">
              {btn("scoresByMachine", "trophy", "By Machine", "text-left")}
              {btn(
                "scoresByPlayer",
                "user-astronaut",
                "By Player",
                "text-left"
              )}
              {btn("allScores", "list", "All Scores", "text-left")}
            </div>
          </details>
        </li>
      </ul>
    </nav>
  );
}
