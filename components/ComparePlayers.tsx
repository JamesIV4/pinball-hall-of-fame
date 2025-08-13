import { useEffect, useMemo, useState } from "react";
import FormContainer from "./ui/FormContainer";
import Select from "./ui/Select";
import { useFirebaseData } from "../hooks/useFirebaseData";
import { safeGetItem, safeRemoveItem } from "../utils/storage";
import { Player, ScoreEntry } from "../types/types";

function calcStats(player: Player | undefined) {
  if (!player) return { totalPlays: 0, bestScore: 0 };
  let totalPlays = 0;
  let bestScore = 0;
  for (const scores of Object.values(player.scores || {})) {
    totalPlays += scores.length;
    for (const s of scores) if (s.score > bestScore) bestScore = s.score;
  }
  return { totalPlays, bestScore };
}

export default function ComparePlayers() {
  const { players } = useFirebaseData();
  const [player1Id, setPlayer1Id] = useState("");
  const [player2Id, setPlayer2Id] = useState("");

  useEffect(() => {
    const prefill = safeGetItem("phof_compare_player1");
    if (prefill && players.some((p) => p.id === prefill)) {
      setPlayer1Id(prefill);
      safeRemoveItem("phof_compare_player1");
    }
  }, [players]);

  useEffect(() => {
    if (!player1Id && players.length) setPlayer1Id(players[0].id);
    if (!player2Id && players.length > 1) {
      const p = players.find((x) => x.id !== player1Id);
      setPlayer2Id(p ? p.id : players[0].id);
    }
  }, [players, player1Id, player2Id]);

  const player1 = players.find((p) => p.id === player1Id);
  const player2 = players.find((p) => p.id === player2Id);

  const stats1 = useMemo(() => calcStats(player1), [player1]);
  const stats2 = useMemo(() => calcStats(player2), [player2]);

  const machineComparison = useMemo(() => {
    if (!player1 || !player2) return [] as { name: string; p1Best: number; p2Best: number }[];
    const names = Array.from(
      new Set([...Object.keys(player1.scores || {}), ...Object.keys(player2.scores || {})]),
    ).sort();
    return names.map((name) => {
      const p1Best = Math.max(...(player1.scores?.[name]?.map((s: ScoreEntry) => s.score) || [0]));
      const p2Best = Math.max(...(player2.scores?.[name]?.map((s: ScoreEntry) => s.score) || [0]));
      return { name, p1Best, p2Best };
    });
  }, [player1, player2]);

  return (
    <div className="space-y-4">
      <FormContainer title="Compare Players">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Select
              label="Player 1"
              value={player1Id}
              onChange={(e) => setPlayer1Id(e.target.value)}
              options={players.map((p) => ({ value: p.id, label: p.name }))}
              placeholder="-- select player --"
            />
          </div>
          <div className="flex-1">
            <Select
              label="Player 2"
              value={player2Id}
              onChange={(e) => setPlayer2Id(e.target.value)}
              options={players.map((p) => ({ value: p.id, label: p.name }))}
              placeholder="-- select player --"
            />
          </div>
        </div>

        {player1 && player2 ? (
          <div className="space-y-8">
            <div className="text-center text-xl md:text-2xl font-bold text-amber-400">
              {player1.name} vs {player2.name}
              <div className="text-sm text-gray-400">Who is the pinball wizard?</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 text-center">
                <h3 className="text-lg font-semibold text-amber-300 mb-2">{player1.name}</h3>
                <p>
                  Total Plays: <span className="font-bold">{stats1.totalPlays}</span>
                </p>
                <p>
                  Best Score: <span className="font-bold">{stats1.bestScore.toLocaleString()}</span>
                </p>
              </div>
              <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 text-center">
                <h3 className="text-lg font-semibold text-amber-300 mb-2">{player2.name}</h3>
                <p>
                  Total Plays: <span className="font-bold">{stats2.totalPlays}</span>
                </p>
                <p>
                  Best Score: <span className="font-bold">{stats2.bestScore.toLocaleString()}</span>
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-200 mb-2">Machine Showdowns</h4>
              {machineComparison.length === 0 ? (
                <p className="text-gray-400">No machines in common yet.</p>
              ) : (
                <div className="space-y-2">
                  {machineComparison.map((m) => (
                    <div
                      key={m.name}
                      className="flex items-center gap-2 p-3 rounded-lg border border-gray-700 bg-gray-800 text-sm md:text-base"
                    >
                      <span className="flex-1 font-semibold text-amber-300">{m.name}</span>
                      <span
                        className={`flex-1 text-right ${m.p1Best >= m.p2Best ? "text-amber-400" : "text-gray-400"}`}
                      >
                        {m.p1Best ? m.p1Best.toLocaleString() : "—"}
                      </span>
                      <span className="mx-1 text-gray-500">vs</span>
                      <span className={`flex-1 text-left ${m.p2Best >= m.p1Best ? "text-amber-400" : "text-gray-400"}`}>
                        {m.p2Best ? m.p2Best.toLocaleString() : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-gray-400">Select two players to compare their pinball prowess.</p>
        )}
      </FormContainer>
    </div>
  );
}
