import { ScoreEntry } from "../../types/types";
import ScoreWithTooltip from "./ScoreWithTooltip";

interface ScoreListProps {
  scores: ScoreEntry[];
  showActions?: boolean;
  onEdit?: (score: ScoreEntry, index: number) => void;
  onDelete?: (score: ScoreEntry, index: number) => void;
  startRank?: number;
}

export default function ScoreList({ scores, showActions = false, onEdit, onDelete, startRank = 1 }: ScoreListProps) {
  return (
    <div className="space-y-1">
      {scores.map((score, i) => (
        <div key={i}>
          <div className="flex items-center">
            <span className="md:text-[23px] font-bold mr-3 w-6 ml-2">{startRank + i}.</span>
            <ScoreWithTooltip score={score} />
            {score.timestamp && (
              <>
                <div className="flex-1 h-px bg-gray-500 mx-3" />
                <div className="text-gray-400 text-sm flex flex-wrap justify-center leading-tight">
                  <span className="whitespace-nowrap">{new Date(score.timestamp).toLocaleDateString()},</span>
                  <span className="whitespace-nowrap">
                    {" "}
                    {new Date(score.timestamp).toLocaleTimeString(undefined, {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </>
            )}
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
          </div>
          {showActions && (
            <div className="flex md:hidden justify-end gap-2 mt-2">
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
        </div>
      ))}
    </div>
  );
}
