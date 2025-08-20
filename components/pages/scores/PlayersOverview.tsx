import FormContainer from "@/components/ui/FormContainer";
import Timestamp from "@/components/ui/Timestamp";
import { useFirebaseData } from "@/hooks/useFirebaseData";
import { Player, ScoreEntry } from "@/types/types";
import { getWeekStart } from "@/utils/weekUtils";
import { goToPlayerStatsForPlayer } from "@/utils/navigation";
import { useMemo } from "react";

type PlayerCardData = {
  id: string;
  name: string;
  totalPlays: number;
  machinesCount: number;
  lastPlayed: string | null;
  playsPerWeek: number;
  weeklyCounts: number[];
};

function summarizePlayer(p: Player): PlayerCardData {
  const scoresByMachine = p.scores || {};
  const machinesCount = Object.keys(scoresByMachine).length;
  let totalPlays = 0;
  let lastPlayed: string | null = null;
  const allTimestamps: string[] = [];

  for (const scores of Object.values(scoresByMachine)) {
    totalPlays += scores.length;
    for (const s of scores) {
      if (s.timestamp) {
        allTimestamps.push(s.timestamp);
        if (!lastPlayed || new Date(s.timestamp) > new Date(lastPlayed)) lastPlayed = s.timestamp;
      }
    }
  }

  // 12-week sparkline counts
  const weeks = 12;
  const currentWeekStart = getWeekStart(new Date());
  const weekStarts: Date[] = [];
  for (let i = 0; i < weeks; i++) {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() - (weeks - 1 - i) * 7);
    weekStarts.push(d);
  }
  const weeklyCounts = new Array(weeks).fill(0);
  for (const ts of allTimestamps) {
    const ws = getWeekStart(new Date(ts));
    const idx = weekStarts.findIndex((w) => w.getTime() === ws.getTime());
    if (idx >= 0) weeklyCounts[idx] += 1;
  }
  const last4 = weeklyCounts.slice(-4);
  const playsPerWeek = last4.length ? Math.round((last4.reduce((a, b) => a + b, 0) / last4.length) * 10) / 10 : 0;

  return {
    id: p.id,
    name: p.name,
    totalPlays,
    machinesCount,
    lastPlayed,
    playsPerWeek,
    weeklyCounts,
  };
}

export default function PlayersOverview() {
  const { players } = useFirebaseData();

  const cards = useMemo(() => players.map(summarizePlayer), [players]);

  return (
    <FormContainer title="Players">
      {players.length === 0 ? (
        <p className="text-gray-400">No players yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((c) => (
            <button
              key={c.id}
              onClick={() => goToPlayerStatsForPlayer(c.id)}
              className="text-left rounded-xl border border-gray-700 bg-gradient-to-br from-gray-800/60 to-gray-900/60 p-4 hover:border-amber-500/60 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="text-lg font-bold text-amber-300 truncate" title={c.name}>
                  {c.name}
                </div>
                <div className="ml-2 text-xs text-gray-400">click for details →</div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded border border-gray-700 bg-gray-800/50 p-2">
                  <div className="text-xs text-gray-400">Total Plays</div>
                  <div className="text-amber-300 font-semibold text-base">{c.totalPlays}</div>
                </div>
                <div className="rounded border border-gray-700 bg-gray-800/50 p-2">
                  <div className="text-xs text-gray-400">Machines</div>
                  <div className="text-amber-300 font-semibold text-base">{c.machinesCount}</div>
                </div>
                <div className="rounded border border-gray-700 bg-gray-800/50 p-2 col-span-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-400">Plays / week (avg)</div>
                      <div className="text-amber-300 font-semibold text-base">{c.playsPerWeek}</div>
                    </div>
                    <div className="ml-3 w-28 h-10">
                      {c.weeklyCounts.length ? (
                        <svg viewBox="0 0 120 40" className="w-full h-full" preserveAspectRatio="none">
                          <polyline
                            fill="none"
                            stroke="#f6c84c"
                            strokeWidth="2"
                            points={c.weeklyCounts
                              .map((v: number, i: number) => {
                                const max = Math.max(...c.weeklyCounts);
                                const x = (i / (c.weeklyCounts.length - 1)) * 120;
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
                <div className="rounded border border-gray-700 bg-gray-800/50 p-2 col-span-2">
                  <div className="text-xs text-gray-400">Last Played</div>
                  <div className="text-gray-300 text-sm">
                    {c.lastPlayed ? new Date(c.lastPlayed).toLocaleString() : "—"}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </FormContainer>
  );
}

