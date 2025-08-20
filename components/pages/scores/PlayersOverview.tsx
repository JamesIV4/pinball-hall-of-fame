import FormContainer from "@/components/ui/FormContainer";
import { useFirebaseData } from "@/hooks/useFirebaseData";
import { Player } from "@/types/types";
import { goToPlayerStatsForPlayer } from "@/utils/navigation";
import { getWeekStart } from "@/utils/weekUtils";
import { useMemo } from "react";

type PlayerCardData = {
  id: string;
  name: string;
  totalScores: number;
  medals: number;
};

function summarizePlayer(p: Player): Omit<PlayerCardData, "medals"> {
  const scoresByMachine = p.scores || {};
  const totalScores = Object.values(scoresByMachine).reduce((sum, scores) => sum + scores.length, 0);

  return { id: p.id, name: p.name, totalScores };
}

export default function PlayersOverview() {
  const { players, machines } = useFirebaseData();

  const cards = useMemo(() => {
    // Base card info (scores count)
    const base = players.map(summarizePlayer);

    // Build set of machine names from machines and player score keys
    const allMachineNames = new Set<string>();
    for (const m of machines) allMachineNames.add(m.name);
    for (const p of players) for (const key of Object.keys(p.scores || {})) allMachineNames.add(key);

    // Initialize medal counts per player
    const medalCounts = new Map<string, number>();
    for (const p of players) medalCounts.set(p.id, 0);

    // All-time medals per machine
    for (const mName of Array.from(allMachineNames)) {
      const bestByPlayer = players
        .map((p) => {
          const list = p.scores?.[mName] || [];
          const best = list.reduce((mx, s) => (s.score > mx ? s.score : mx), 0);
          return { playerId: p.id, best };
        })
        .filter((x) => x.best > 0)
        .sort((a, b) => b.best - a.best);

      for (let i = 0; i < Math.min(3, bestByPlayer.length); i++) {
        medalCounts.set(bestByPlayer[i].playerId, (medalCounts.get(bestByPlayer[i].playerId) || 0) + 1);
      }
    }

    // Weekly medals per machine/week
    for (const mName of Array.from(allMachineNames)) {
      const weekBuckets = new Map<number, { playerId: string; score: number }[]>();
      for (const p of players) {
        const list = p.scores?.[mName] || [];
        for (const s of list) {
          if (!s.timestamp) continue;
          const ws = getWeekStart(new Date(s.timestamp)).getTime();
          if (!weekBuckets.has(ws)) weekBuckets.set(ws, []);
          weekBuckets.get(ws)!.push({ playerId: p.id, score: s.score });
        }
      }

      for (const [, entries] of weekBuckets.entries()) {
        const map = new Map<string, number>();
        for (const e of entries) map.set(e.playerId, Math.max(map.get(e.playerId) || 0, e.score));
        const ranked = Array.from(map.entries())
          .map(([pid, best]) => ({ playerId: pid, best }))
          .filter((x) => x.best > 0)
          .sort((a, b) => b.best - a.best);
        for (let i = 0; i < Math.min(3, ranked.length); i++) {
          medalCounts.set(ranked[i].playerId, (medalCounts.get(ranked[i].playerId) || 0) + 1);
        }
      }
    }

    // Merge medal counts into base cards
    return base.map((c) => ({ ...c, medals: medalCounts.get(c.id) || 0 }));
  }, [players, machines]);

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
              <div className="flex items-center justify-between">
                <div className="text-lg font-bold text-amber-300 truncate" title={c.name}>
                  {c.name}
                </div>
                <div className="ml-2 text-xs text-gray-400">details →</div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded border border-gray-700 bg-gray-800/50 p-3">
                  <div className="text-xs text-gray-400">Scores</div>
                  <div className="text-2xl font-extrabold text-amber-300 leading-none">{c.totalScores}</div>
                </div>
                <div className="rounded border border-gray-700 bg-gray-800/50 p-3">
                  <div className="text-xs text-gray-400">Medals</div>
                  <div className="text-2xl font-extrabold text-amber-300 leading-none">{c.medals}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </FormContainer>
  );
}
