import {
  Dispatch,
  SetStateAction,
  useRef,
  useEffect,
  MutableRefObject,
} from "react";

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
  const manageRef = useRef<HTMLDetailsElement>(null);
  const scoresRef = useRef<HTMLDetailsElement>(null);

  // Close panels when clicking outside – delayed one tick so native controls can open first
  useEffect(() => {
    const closeIfOutside = (e: MouseEvent) => {
      // Let <select>, <input>, etc. handle the click before collapsing
      setTimeout(() => {
        [manageRef, scoresRef].forEach((r) => {
          if (r.current?.open && !r.current.contains(e.target as Node)) {
            r.current.open = false;
          }
        });
      }, 0);
    };
    document.addEventListener("click", closeIfOutside);
    return () => document.removeEventListener("click", closeIfOutside);
  }, []);

  const btn = (
    id: View,
    icon: string,
    label: string,
    parent?: MutableRefObject<HTMLDetailsElement | null>,
    extra = ""
  ) => (
    <button
      onClick={() => {
        setView(id);
        parent?.current && (parent.current.open = false);
      }}
      className={`flex items-center gap-2 px-3 py-1 rounded hover:bg-gray-600 transition-colors ${
        view === id ? "bg-gray-600" : ""
      } ${extra}`}
    >
      <span className="material-symbols-outlined text-lg">{icon}</span>
      <span className="hidden sm:inline-block">{label}</span>
    </button>
  );

  const manageViews: View[] = ["addMachine", "addPlayer", "addScore"];
  const scoresViews: View[] = [
    "scoresByMachine",
    "scoresByPlayer",
    "allScores",
  ];

  // Shared overlay panel classes — note the new max-width
  const panelClasses =
    "absolute z-20 top-full left-1/2 -translate-x-1/2 mt-1 min-w-max flex flex-col gap-2 bg-gray-700 p-2 rounded-lg shadow-lg";

  return (
    <nav className="mb-8">
      <ul className="flex flex-wrap items-center justify-center gap-2">
        {/* Home */}
        <li>{btn("home", "cottage", "Home")}</li>

        {/* Manage dropdown */}
        <li>
          <details ref={manageRef} className="relative">
            <summary className="list-none">
              {btn("addMachine", "build", "Manage")}
            </summary>
            <div className={panelClasses}>
              {manageViews.map((v) => (
                <div key={v}>{btn(v, "", v.replace(/([A-Z])/g, " $1"))}</div>
              ))}
            </div>
          </details>
        </li>

        {/* Scores dropdown */}
        <li>
          <details ref={scoresRef} className="relative">
            <summary className="list-none">
              {btn("scoresByMachine", "emoji_events", "Scores")}
            </summary>
            <div className={panelClasses}>
              {scoresViews.map((v) => (
                <div key={v}>{btn(v, "", v.replace(/([A-Z])/g, " $1"))}</div>
              ))}
            </div>
          </details>
        </li>
      </ul>
    </nav>
  );
}
