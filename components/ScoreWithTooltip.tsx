import { ScoreEntry } from "../types/types";

function formatTimestamp(timestamp?: string) {
  if (!timestamp) return "Date not recorded";
  try {
    return new Date(timestamp).toLocaleString();
  } catch (e) {
    return "Invalid date";
  }
}

export default function ScoreWithTooltip({ score }: { score: ScoreEntry }) {
  return (
    <div className="relative group flex justify-end">
      <span className="font-dotmatrix text-[36px] md:text-[51px] text-amber-300">
        {score.score.toLocaleString()}
      </span>
      {score.timestamp && (
        <div className="absolute bottom-full mb-2 w-max px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
          {formatTimestamp(score.timestamp)}
        </div>
      )}
    </div>
  );
}
