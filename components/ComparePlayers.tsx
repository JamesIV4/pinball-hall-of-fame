import { useEffect, useMemo, useState } from "react";
import FormContainer from "./ui/FormContainer";
import Select from "./ui/Select";
import { useFirebaseData } from "@/hooks/useFirebaseData";
import { Player } from "@/types/types";
import { safeGetItem, safeRemoveItem } from "@/utils/storage";

interface PlayerStatsData {
  totalPlays: number;
  bestScore: number;
  lastPlayed: string | null;
  topMachines: { name: string; count: number }[];
  bestByMachine: Record<string, number>;
}

function computeStats(player: Player | undefined): PlayerStatsData | null {
  if (!player) return null;

  let totalPlays = 0;
  let bestScore = 0;
  let lastPlayed: string | null = null;
  const machineCounts = new Map<string, number>();
  const bestByMachine: Record<string, number> = {};

  for (const [mName, scores] of Object.entries(player.scores || {})) {
    machineCounts.set(mName, (machineCounts.get(mName) || 0) + scores.length);
    const best = scores.reduce((mx, s) => {
      totalPlays += 1;
      if (s.timestamp) {
        if (!lastPlayed || new Date(s.timestamp) > new Date(lastPlayed)) {
          lastPlayed = s.timestamp;
        }
      }
      if (s.score > mx) mx = s.score;
      return mx;
    }, 0);
    if (best > bestScore) bestScore = best;
    bestByMachine[mName] = best;
  }

  const topMachines = Array.from(machineCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }));

  return { totalPlays, bestScore, lastPlayed, topMachines, bestByMachine };
}

export default function ComparePlayers() {
  const { players } = useFirebaseData();
  const [player1Id, setPlayer1Id] = useState("");
  const [player2Id, setPlayer2Id] = useState("");

  // Prefill first player from localStorage
  useEffect(() => {
    if (!player1Id) {
      const stored = safeGetItem("phof_compare_player1");
      if (stored && players.some((p) => p.id === stored)) {
        setPlayer1Id(stored);
        safeRemoveItem("phof_compare_player1");
      }
    }
  }, [players, player1Id]);

  // Default selections when players load
  useEffect(() => {
    if (!players.length) return;
    if (!player1Id) setPlayer1Id(players[0].id);
    if (!player2Id) {
      const second = players.find((p) => p.id !== player1Id);
      if (second) setPlayer2Id(second.id);
    }
  }, [players, player1Id, player2Id]);

  const player1 = players.find((p) => p.id === player1Id);
  const player2 = players.find((p) => p.id === player2Id);

  const stats1 = useMemo(() => computeStats(player1), [player1]);
  const stats2 = useMemo(() => computeStats(player2), [player2]);

  const allMachines = useMemo(() => {
    const set = new Set<string>();
    Object.keys(stats1?.bestByMachine || {}).forEach((m) => set.add(m));
    Object.keys(stats2?.bestByMachine || {}).forEach((m) => set.add(m));
    return Array.from(set).sort();
  }, [stats1, stats2]);

  const winner = (val1: number, val2: number) => (val1 === val2 ? "" : val1 > val2 ? "text-amber-400" : "text-blue-400");

  return (
    <div className="space-y-4">
      <FormContainer title="Compare Players">
        <div className="flex flex-col md:flex-row gap-4">
          <Select
            label="Player 1"
            value={player1Id}
            onChange={(e) => setPlayer1Id(e.target.value)}
            options={players.map((p) => ({ value: p.id, label: p.name }))}
            placeholder="-- select --"
          />
          <Select
            label="Player 2"
            value={player2Id}
            onChange={(e) => setPlayer2Id(e.target.value)}
            options={players.map((p) => ({ value: p.id, label: p.name }))}
            placeholder="-- select --"
          />
        </div>

        {player1 && player2 ? (
          <div className="mt-6 space-y-8">
            {/* Light summary */}
            <div className="flex flex-col md:flex-row gap-4 text-center">
              <div className="flex-1 p-4 rounded-lg bg-gray-800">
                <h3 className="text-xl font-bold text-amber-400">{player1.name}</h3>
                <p className="mt-2">
                  Total plays: <span className={winner(stats1?.totalPlays || 0, stats2?.totalPlays || 0)}>{stats1?.totalPlays || 0}</span>
                </p>
                <p>
                  Best score: <span className={winner(stats1?.bestScore || 0, stats2?.bestScore || 0)}>{stats1?.bestScore?.toLocaleString() || 0}</span>
                </p>
              </div>
              <div className="flex items-center justify-center md:w-16 text-2xl">vs</div>
              <div className="flex-1 p-4 rounded-lg bg-gray-800">
                <h3 className="text-xl font-bold text-blue-400">{player2.name}</h3>
                <p className="mt-2">
                  Total plays: <span className={winner(stats2?.totalPlays || 0, stats1?.totalPlays || 0)}>{stats2?.totalPlays || 0}</span>
                </p>
                <p>
                  Best score: <span className={winner(stats2?.bestScore || 0, stats1?.bestScore || 0)}>{stats2?.bestScore?.toLocaleString() || 0}</span>
                </p>
              </div>
            </div>

            {/* Top machines */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-200">Top Machines</h4>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <h5 className="text-amber-400 font-bold mb-2">{player1.name}</h5>
                  <ul className="list-disc list-inside text-sm">
                    {stats1?.topMachines.map((m) => (
                      <li key={m.name}>
                        {m.name} ({m.count})
                      </li>
                    )) || <li>No plays yet</li>}
                  </ul>
                </div>
                <div className="flex-1">
                  <h5 className="text-blue-400 font-bold mb-2">{player2.name}</h5>
                  <ul className="list-disc list-inside text-sm">
                    {stats2?.topMachines.map((m) => (
                      <li key={m.name}>
                        {m.name} ({m.count})
                      </li>
                    )) || <li>No plays yet</li>}
                  </ul>
                </div>
              </div>
            </div>

            {/* Deep dive per machine */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-200">Head-to-Head Scores</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-gray-700">
                      <th className="py-2 pr-4">Machine</th>
                      <th className="py-2 pr-4">{player1.name}</th>
                      <th className="py-2 pr-4">{player2.name}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allMachines.map((m) => {
                      const s1 = stats1?.bestByMachine[m] || 0;
                      const s2 = stats2?.bestByMachine[m] || 0;
                      return (
                        <tr key={m} className="border-b border-gray-800">
                          <td className="py-2 pr-4">{m}</td>
                          <td className={`py-2 pr-4 ${winner(s1, s2)}`}>{s1 ? s1.toLocaleString() : "—"}</td>
                          <td className={`py-2 pr-4 ${winner(s2, s1)}`}>{s2 ? s2.toLocaleString() : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-6 text-gray-400">Select two players to compare their stats.</p>
        )}
      </FormContainer>
    </div>
  );
}

