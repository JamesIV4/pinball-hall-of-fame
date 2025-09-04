import React from "react";
import Timestamp from "./Timestamp";
import { goToPlayerStatsForPlayer } from "@/utils/navigation";

type Variant = "full" | "ago" | "date";

export default function PlayerTimestamp({
  playerName,
  playerId,
  timestamp,
  variant = "date",
  className = "",
}: {
  playerName: string;
  playerId?: string;
  timestamp?: string;
  variant?: Variant;
  className?: string;
}) {
  if (!timestamp) return null;

  return (
    <div className={`text-xs text-gray-400 inline-flex items-center gap-1 relative z-10 ${className}`}>
      {playerId ? (
        <button
          className="font-semibold text-blue-200 hover:underline relative z-10 pointer-events-auto"
          onClick={(e) => {
            e.stopPropagation();
            goToPlayerStatsForPlayer(playerId);
          }}
          title="View player stats"
        >
          {playerName}
        </button>
      ) : (
        <span className="font-semibold text-blue-200 relative z-10">{playerName}</span>
      )}
      <span className="text-gray-500">•</span>
      <Timestamp as="span" variant={variant} timestamp={timestamp} />
    </div>
  );
}
