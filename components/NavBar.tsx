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

  /** helper for individual buttons */
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
      {/* top row – wraps if the screen is super-narrow */}
      <ul className="flex flex-wrap items-center justify-center gap-2">
        {/* Home */}
        <li>{btn("home", "home", "Home")}</li>

        {/* Manage dropdown */}
        <li className="relative">
          <details className="group">
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

            {/* overlay panel – absolute at *all* sizes */}
            <div className="absolute z-20 top-full left-1/2 -translate-x-1/2 mt-1 min-w-[12rem] w-max flex flex-col gap-2 bg-gray-800 p-2 rounded-lg shadow-lg">
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
                scoresViews.includes(view) ? "active" : ""
              }`}
            >
              <span className="flex items-center">
                <i className="fas fa-trophy mr-2" />
                Scores
              </span>
              <i className="fas fa-chevron-down ml-2 transition-transform group-open:rotate-180" />
            </summary>

            <div className="absolute z-20 top-full left-1/2 -translate-x-1/2 mt-1 min-w-[12rem] w-max flex flex-col gap-2 bg-gray-800 p-2 rounded-lg shadow-lg">
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
