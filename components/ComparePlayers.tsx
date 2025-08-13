import { useEffect, useMemo, useState } from "react";
import FormContainer from "./ui/FormContainer";
import Select from "./ui/Select";
import MachineInfo from "./ui/MachineInfo";
import { useFirebaseData } from "../hooks/useFirebaseData";
import { safeGetItem, safeRemoveItem } from "../utils/storage";

export default function ComparePlayers() {
  const { machines, players } = useFirebaseData();
  const [player1Id, setPlayer1Id] = useState("");
  const [player2Id, setPlayer2Id] = useState("");

  // prefill first player from local storage if available
  useEffect(() => {
    const stored = safeGetItem("phof_compare_player1");
    if (stored && players.some((p) => p.id === stored)) {
      setPlayer1Id(stored);
      safeRemoveItem("phof_compare_player1");
    }
  }, [players]);

  const player1 = players.find((p) => p.id === player1Id);
  const player2 = players.find((p) => p.id === player2Id);

  // compute overall stats for each player
  const calcStats = (player: typeof player1) => {
    if (!player) return { totalPlays: 0, bestScore: 0, lastPlayed: null as string | null, topMachine: "" };
    let totalPlays = 0;
    let bestScore = 0;
    let lastPlayed: string | null = null;
    const machineCounts = new Map<string, number>();

    for (const [mName, scores] of Object.entries(player.scores || {})) {
      machineCounts.set(mName, (machineCounts.get(mName) || 0) + scores.length);
      for (const s of scores) {
        totalPlays += 1;
        if (s.score > bestScore) bestScore = s.score;
        if (s.timestamp && (!lastPlayed || new Date(s.timestamp) > new Date(lastPlayed))) {
          lastPlayed = s.timestamp;
        }
      }
    }

    const topMachine = Array.from(machineCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
    return { totalPlays, bestScore, lastPlayed, topMachine };
  };

  const stats1 = useMemo(() => calcStats(player1), [player1]);
  const stats2 = useMemo(() => calcStats(player2), [player2]);

  // union of machines for detailed comparison
  const machineNames = useMemo(() => {
    const set = new Set<string>();
    player1 && Object.keys(player1.scores || {}).forEach((m) => set.add(m));
    player2 && Object.keys(player2.scores || {}).forEach((m) => set.add(m));
    return Array.from(set).sort();
  }, [player1, player2]);

  const { lead1, lead2 } = useMemo(() => {
    let lead1 = 0;
    let lead2 = 0;
    machineNames.forEach((mName) => {
      const best1 = Math.max(...(player1?.scores?.[mName] || []).map((s) => s.score), 0);
      const best2 = Math.max(...(player2?.scores?.[mName] || []).map((s) => s.score), 0);
      if (best1 > best2) lead1++;
      else if (best2 > best1) lead2++;
    });
    return { lead1, lead2 };
  }, [machineNames, player1, player2]);

  return (
    <div className="space-y-4">
      <FormContainer title="Compare Players">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Select
              label="Player 1"
              value={player1Id}
              onChange={(e) => {
                const id = e.target.value;
                setPlayer1Id(id);
                if (id === player2Id) setPlayer2Id("");
              }}
              options={players.filter((p) => p.id !== player2Id).map((p) => ({ value: p.id, label: p.name }))}
              placeholder="-- select player --"
            />
          </div>
          <div className="flex-1">
            <Select
              label="Player 2"
              value={player2Id}
              onChange={(e) => {
                const id = e.target.value;
                setPlayer2Id(id);
                if (id === player1Id) setPlayer1Id("");
              }}
              options={players.filter((p) => p.id !== player1Id).map((p) => ({ value: p.id, label: p.name }))}
              placeholder="-- select player --"
            />
          </div>
        </div>

        {player1 && player2 && (
          <div className="mt-4 space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold">
                <span className="text-amber-400">{player1.name}</span> vs{" "}
                <span className="text-amber-400">{player2.name}</span>
              </h3>
              <p className="text-gray-300">Who is the pinball wizard?</p>
            </div>

            {/* overview stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { p: player1, s: stats1, led: lead1 },
                { p: player2, s: stats2, led: lead2 },
              ].map(({ p, s, led }, idx) => (
                <div key={idx} className="rounded-lg border border-gray-700 p-4 bg-gray-900/40">
                  <h4 className="font-semibold text-amber-300 mb-2 text-center">{p?.name}</h4>
                  <ul className="space-y-1 text-sm text-gray-200">
                    <li className="text-center">
                      Total plays: <strong>{s.totalPlays}</strong>
                    </li>
                    <li className="text-center">
                      Machines Led: <strong>{led}</strong>
                    </li>
                    <li className="text-center">
                      Last played: <strong>{s.lastPlayed ? new Date(s.lastPlayed).toLocaleDateString() : "—"}</strong>
                    </li>
                    <li className="text-center">
                      Favorite machine: <strong>{s.topMachine || "—"}</strong>
                    </li>
                  </ul>
                </div>
              ))}
            </div>

            {/* detailed machine comparison */}
            {machineNames.length > 0 && (
              <div className="mt-6 space-y-4">
                <h4 className="text-lg font-bold text-amber-400">Machine Showdown</h4>
                {machineNames.map((mName) => {
                  const machine = machines.find((m) => m.name === mName);
                  const scores1 = [...(player1?.scores?.[mName] || [])].sort((a, b) => b.score - a.score);
                  const scores2 = [...(player2?.scores?.[mName] || [])].sort((a, b) => b.score - a.score);
                  const best1 = scores1[0]?.score || 0;
                  const best2 = scores2[0]?.score || 0;
                  const plays1 = scores1.length;
                  const plays2 = scores2.length;
                  const winner = best1 === best2 ? null : best1 > best2 ? 1 : 2;
                  return (
                    <div
                      key={mName}
                      className="rounded-xl border border-gray-700 p-4 bg-gradient-to-br from-gray-800/60 to-gray-900/60"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        {machine ? <MachineInfo machine={machine} imageSize="sm" hideName /> : null}
                        <h5 className="text-lg font-semibold text-amber-300">{mName}</h5>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className={`p-3 rounded border ${winner === 1 ? "border-amber-500" : "border-gray-700"}`}>
                          <div className="font-semibold mb-1">{player1.name}</div>
                          <div>Best: {best1 ? best1.toLocaleString() : "—"}</div>
                          <div>Plays: {plays1}</div>
                        </div>
                        <div className={`p-3 rounded border ${winner === 2 ? "border-amber-500" : "border-gray-700"}`}>
                          <div className="font-semibold mb-1">{player2.name}</div>
                          <div>Best: {best2 ? best2.toLocaleString() : "—"}</div>
                          <div>Plays: {plays2}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </FormContainer>
    </div>
  );
}
