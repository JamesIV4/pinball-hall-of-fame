import { ScoreEntry } from "../../types/types";
import Timestamp from "./Timestamp";

interface ScoreListProps {
  scores: ScoreEntry[];
  showActions?: boolean;
  onEdit?: (score: ScoreEntry, index: number) => void;
  onDelete?: (score: ScoreEntry, index: number) => void;
  startRank?: number;
}

export default function ScoreList({ scores, showActions = false, onEdit, onDelete, startRank = 1 }: ScoreListProps) {
  const topScore = Math.max(1, ...scores.map((s) => s.score));

  return (
    <ul className="rounded-xl border border-gray-700 bg-gray-800/60 divide-y divide-gray-700/60 overflow-hidden">
      {scores.map((score, i) => {
        const pct = Math.max(0.05, Math.min(1, score.score / topScore));

        const barStyle: React.CSSProperties = {
          width: `${pct * 100}%`,
          backgroundImage:
            `linear-gradient(rgba(115, 14, 106, 0.11), rgba(72, 57, 151, 0.14), rgba(168, 85, 247, 0)), ` +
            `linear-gradient(to left, rgb(0 92 129 / 28%), rgba(0, 89, 129, 0.18), rgba(0, 89, 129, 0))`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "100% 100%",
        };

        const chipBase = "inline-flex h-8 w-8 items-center justify-center rounded border font-semibold text-sm";
        const chipClass = "bg-gray-700 text-gray-300 border-gray-600";

        return (
          <li
            key={`${score.timestamp ?? "no-ts"}-${score.score}-${i}`}
            className="relative p-3 md:p-4 flex items-center gap-4 row-underlay-diag hover:bg-gray-800/80 transition-colors transition-transform duration-150 hover:translate-x-[2px] group"
          >
            <div className="absolute inset-y-0 left-0 strength-bar" style={barStyle} />
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-700" />

            <span className={`${chipBase} ${chipClass}`}>{startRank + i}</span>

            <div className="min-w-0">
              {score.timestamp && (
                <div className="text-xs text-gray-400">
                  <span className="px-2 py-0.5 rounded-full bg-black/30 border border-gray-700">
                    <Timestamp timestamp={score.timestamp} variant="date" as="span" />
                  </span>
                </div>
              )}
            </div>

            <div className="ml-auto font-dotmatrix whitespace-nowrap leading-none text-[32px] md:text-[40px] dmd-score">
              {score.score.toLocaleString()}
            </div>

            {showActions && (
              <div className="hidden md:flex gap-2 ml-4">
                {onEdit && (
                  <button
                    onClick={() => onEdit(score, i)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-semibold transition-colors"
                  >
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(score, i)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-semibold transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
