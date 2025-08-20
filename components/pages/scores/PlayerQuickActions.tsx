import { goToAddScoreForPlayer, goToComparePlayersWithPlayer } from "@/utils/navigation";

interface PlayerQuickActionsProps {
  playerId?: string;
}

export default function PlayerQuickActions({ playerId }: PlayerQuickActionsProps) {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-3">
      <h4 className="text-sm font-semibold text-gray-200">Quick Actions</h4>
      <div className="mt-3 flex flex-col gap-2">
        <button
          className="px-3 py-2 rounded bg-amber-500 text-black font-semibold hover:bg-amber-400"
          onClick={() => playerId && goToAddScoreForPlayer(playerId)}
        >
          Add Score for Player
        </button>
        <button
          className="px-3 py-2 rounded bg-blue-500 text-black font-semibold hover:bg-blue-400"
          onClick={() => playerId && goToComparePlayersWithPlayer(playerId)}
        >
          Compare Players
        </button>
      </div>
    </div>
  );
}
