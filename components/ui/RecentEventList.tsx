import React, { useEffect, useState } from "react";
import { ScoreEntry } from "@/types/types";
import Timestamp from "./Timestamp";
import { goToHighScoresForMachine, goToPlayerStatsForPlayer } from "@/utils/navigation";

export type RecentEventItem = {
  playerId: string;
  playerName: string;
  machineName: string;
  entry: ScoreEntry;
};

interface RecentEventListProps {
  items: RecentEventItem[];
  showActions?: boolean;
  onEdit?: (item: RecentEventItem) => void;
  onDelete?: (item: RecentEventItem) => void;
  showIcon?: boolean;
}

export default function RecentEventList({
  items,
  showActions = false,
  onEdit,
  onDelete,
  showIcon = false,
}: RecentEventListProps) {
  const [openMenuKey, setOpenMenuKey] = useState<string | null>(null);

  useEffect(() => {
    const handler = () => setOpenMenuKey(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  if (items.length === 0) {
    return <p className="text-gray-400">No scores found.</p>;
  }

  return (
    <ul className="rounded-xl overflow-hidden border border-gray-700 bg-gray-800/60 divide-y divide-gray-700/60">
      {items.map((e, idx) => {
        const key = `${e.playerId}-${e.entry.timestamp ?? "no-ts"}-${e.entry.score}-${idx}`;
        return (
          <li key={key} className="relative p-3 md:p-4 flex items-center gap-4 hover:bg-gray-800/80 transition-colors">
            {showIcon && (
              <span className="inline-flex h-9 w-9 items-center justify-center rounded bg-gray-700 text-gray-300 border border-gray-600">
                🕹️
              </span>
            )}

            {/* Desktop actions on the left for Manage-style lists */}
            {showActions && (
              <div className="hidden md:flex items-center gap-2">
                {onEdit && (
                  <button
                    onClick={() => onEdit(e)}
                    title="Edit score"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 hover:bg-blue-500 text-white border border-blue-700 shadow-sm"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden
                    >
                      <path d="M17.414 2.586a2 2 0 010 2.828l-9.9 9.9a1 1 0 01-.465.263l-4 1a1 1 0 01-1.213-1.213l1-4a1 1 0 01.263-.465l9.9-9.9a2 2 0 012.828 0z" />
                    </svg>
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(e)}
                    title="Delete score"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-red-600 hover:bg-red-500 text-white border border-red-700 shadow-sm"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 011.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                )}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="text-sm text-gray-200 truncate">
                <button
                  className="font-semibold text-blue-200 hover:underline"
                  onClick={() => goToPlayerStatsForPlayer(e.playerId)}
                  title="View player stats"
                >
                  {e.playerName}
                </button>
                <span className="mx-1 text-gray-500">on</span>
                <button
                  className="text-green-300 hover:underline"
                  onClick={() => goToHighScoresForMachine(e.machineName)}
                  title="View machine high scores"
                >
                  {e.machineName}
                </button>
              </div>
              {e.entry.timestamp && <Timestamp timestamp={e.entry.timestamp} />}
            </div>

            <div className="ml-2 md:ml-auto flex items-center gap-2">
              <div className="font-dotmatrix text-[36px] md:text-[48px] leading-none text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.25)]">
                {e.entry.score.toLocaleString()}
              </div>

              {/* Mobile hamburger menu */}
              {showActions && (onEdit || onDelete) && (
                <div className="md:hidden relative">
                  <button
                    onClick={(ev) => {
                      ev.stopPropagation();
                      setOpenMenuKey((cur) => (cur === key ? null : key));
                    }}
                    title="Actions"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-gray-700 hover:bg-gray-600 text-white border border-gray-600 shadow-sm"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden
                    >
                      <circle cx="6" cy="12" r="1.5" />
                      <circle cx="12" cy="12" r="1.5" />
                      <circle cx="18" cy="12" r="1.5" />
                    </svg>
                  </button>
                  {openMenuKey === key && (
                    <div
                      onClick={(ev) => ev.stopPropagation()}
                      className="absolute z-10 mt-2 right-0 rounded-md border border-gray-700 bg-gray-800 shadow-lg overflow-hidden min-w-max"
                    >
                      {onEdit && (
                        <button
                          onClick={() => {
                            onEdit(e);
                            setOpenMenuKey(null);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-700 flex items-center gap-2"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-blue-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden
                          >
                            <path d="M17.414 2.586a2 2 0 010 2.828l-9.9 9.9a1 1 0 01-.465.263l-4 1a1 1 0 01-1.213-1.213l1-4a1 1 0 01.263-.465l9.9-9.9a2 2 0 012.828 0z" />
                          </svg>
                          Edit
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => {
                            onDelete(e);
                            setOpenMenuKey(null);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-700 flex items-center gap-2"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-red-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 011.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
