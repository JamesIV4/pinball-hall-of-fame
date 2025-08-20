import Timestamp from "@/components/ui/Timestamp";
import { goToHighScoresForMachine } from "@/utils/navigation";

type MedalColor = "gold" | "silver" | "bronze";

export type PlayerSummaryStats = {
  totalPlays: number;
  weeklyCounts: number[];
  playsPerWeek: number;
  lastPlayed: string | null;
  topMachines: { name: string; count: number }[];
};

export type PlayerSummaryMedals = {
  allTime: { color: MedalColor; machine: string }[];
  weekly: { color: MedalColor; machine: string; weekStart: Date }[];
};

interface PlayerSummaryPanelProps {
  playerName?: string;
  machineCount: number;
  stats: PlayerSummaryStats;
  medals: PlayerSummaryMedals;
}

export default function PlayerSummaryPanel({ playerName, machineCount, stats, medals }: PlayerSummaryPanelProps) {
  return (
    <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-blue-300">Player Summary</h3>
      </div>

      {!playerName ? (
        <div className="text-sm text-gray-400 mt-3">No player selected.</div>
      ) : (
        <div className="mt-3 space-y-3 text-sm">
          <div className="bg-gray-800/60 rounded p-3 border border-gray-700">
            <div className="text-xs text-gray-400">Total Plays</div>
            <div className="text-xl font-bold text-amber-300">{stats.totalPlays}</div>
          </div>

          <div className="bg-gray-800/60 rounded p-3 border border-gray-700">
            <div className="text-xs text-gray-400">Machines</div>
            <div className="text-xl font-bold text-amber-300">{machineCount}</div>
          </div>

          <div className="bg-gray-800/60 rounded p-3 border border-gray-700">
            <div className="text-xs text-gray-400">Medals</div>
            <div className="text-xl font-bold text-amber-300">{medals.allTime.length + medals.weekly.length}</div>
          </div>

          <div className="bg-gray-800/60 rounded p-3 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-400">Plays / week (avg)</div>
                <div className="text-xl font-bold text-amber-300">{stats.playsPerWeek ?? 0}</div>
              </div>

              <div className="ml-3 w-28 h-10">
                {stats.weeklyCounts?.length ? (
                  <svg viewBox="0 0 120 40" className="w-full h-full" preserveAspectRatio="none">
                    <polyline
                      fill="none"
                      stroke="#f6c84c"
                      strokeWidth="2"
                      points={stats.weeklyCounts
                        .map((v: number, i: number) => {
                          const max = Math.max(...stats.weeklyCounts);
                          const x = (i / (stats.weeklyCounts.length - 1)) * 120;
                          const y = max ? 40 - (v / max) * 36 : 40;
                          return `${x.toFixed(2)},${y.toFixed(2)}`;
                        })
                        .join(" ")}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  </svg>
                ) : (
                  <div className="text-xs text-gray-400">No data</div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gray-800/60 rounded p-3 border border-gray-700">
            <div className="text-xs text-gray-400">Last Played</div>
            <div className="text-sm text-gray-300">
              {stats.lastPlayed ? new Date(stats.lastPlayed).toLocaleString() : "—"}
            </div>
          </div>

          <div className="bg-gray-800/60 rounded p-3 border border-gray-700">
            <div className="text-xs text-gray-400">Top Machines</div>
            <div className="mt-2 space-y-1">
              {stats.topMachines?.length ? (
                stats.topMachines.map((m) => (
                  <div key={m.name} className="flex items-center justify-between text-sm text-green-200">
                    <button
                      className="truncate text-left hover:underline"
                      onClick={() => goToHighScoresForMachine(m.name)}
                      title="View machine high scores"
                    >
                      {m.name}
                    </button>
                    <span className="text-gray-300">{m.count}</span>
                  </div>
                ))
              ) : (
                <div className="text-gray-400">—</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
