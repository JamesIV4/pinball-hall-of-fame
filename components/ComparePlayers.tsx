import { useEffect, useMemo, useState } from "react";
import FormContainer from "./ui/FormContainer";
import Select from "./ui/Select";
import { useFirebaseData } from "../hooks/useFirebaseData";
import { safeGetItem, safeRemoveItem } from "../utils/storage";

export default function ComparePlayers() {
  const { players } = useFirebaseData();
  const [player1Id, setPlayer1Id] = useState("");
  const [player2Id, setPlayer2Id] = useState("");

  // Prefill first player from localStorage
  useEffect(() => {
    const stored = safeGetItem("phof_compare_player");
    if (stored) {
      setPlayer1Id(stored);
      safeRemoveItem("phof_compare_player");
    }
  }, []);

  // Set default selections once players load
  useEffect(() => {
    if (players.length) {
      if (!player1Id) {
        setPlayer1Id(players[0].id);
      }
      if (!player2Id) {
        const second = players.find((p) => p.id !== player1Id)?.id || players[0].id;
        setPlayer2Id(second);
      }
    }
  }, [players, player1Id, player2Id]);

  const player1 = players.find((p) => p.id === player1Id);
  const player2 = players.find((p) => p.id === player2Id);

  const comparison = useMemo(() => {
    if (!player1 || !player2) return null;

    const machineNames = Array.from(
      new Set([...Object.keys(player1.scores || {}), ...Object.keys(player2.scores || {})]),
    ).sort();

    const machineStats = machineNames.map((mName) => {
      const p1Scores = player1.scores?.[mName] || [];
      const p2Scores = player2.scores?.[mName] || [];
      const p1Best = p1Scores.reduce((mx, s) => (s.score > mx ? s.score : mx), 0);
      const p2Best = p2Scores.reduce((mx, s) => (s.score > mx ? s.score : mx), 0);
      return {
        mName,
        p1Best,
        p2Best,
        p1Plays: p1Scores.length,
        p2Plays: p2Scores.length,
      };
    });

    const totalPlays1 = Object.values(player1.scores || {}).reduce((sum, arr) => sum + arr.length, 0);
    const totalPlays2 = Object.values(player2.scores || {}).reduce((sum, arr) => sum + arr.length, 0);
    const bestScore1 = machineStats.reduce((mx, m) => (m.p1Best > mx ? m.p1Best : mx), 0);
    const bestScore2 = machineStats.reduce((mx, m) => (m.p2Best > mx ? m.p2Best : mx), 0);
    const machinesLed1 = machineStats.filter((m) => m.p1Best > m.p2Best).length;
    const machinesLed2 = machineStats.filter((m) => m.p2Best > m.p1Best).length;

    return {
      machineStats,
      totalPlays1,
      totalPlays2,
      bestScore1,
      bestScore2,
      machinesLed1,
      machinesLed2,
    };
  }, [player1, player2]);

  return (
    <div className="space-y-4">
      <FormContainer title="Compare Players">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Select
              value={player1Id}
              onChange={(e) => setPlayer1Id(e.target.value)}
              options={players.map((p) => ({ value: p.id, label: p.name }))}
              label="Player One"
            />
          </div>
          <div className="flex-1">
            <Select
              value={player2Id}
              onChange={(e) => setPlayer2Id(e.target.value)}
              options={players.map((p) => ({ value: p.id, label: p.name }))}
              label="Player Two"
            />
          </div>
        </div>

        {!player1 || !player2 ? (
          <p className="text-gray-400">Select two players to see who rules the arcade.</p>
        ) : (
          <div className="space-y-6">
            {/* Light-hearted intro */}
            <div className="text-center">
              <h3 className="text-3xl font-bold text-amber-300 mb-1">{player1.name} vs {player2.name}</h3>
              <p className="text-gray-400">Let the pinballs fly! 🎉</p>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 text-center">
                <h4 className="text-xl font-semibold text-amber-300 mb-2">{player1.name}</h4>
                <div className="text-gray-200">Total Plays: {comparison?.totalPlays1 ?? 0}</div>
                <div className="text-gray-200">Best Score: {comparison?.bestScore1.toLocaleString()}</div>
                <div className="text-gray-200">Machines Led: {comparison?.machinesLed1}</div>
              </div>
              <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 text-center">
                <h4 className="text-xl font-semibold text-amber-300 mb-2">{player2.name}</h4>
                <div className="text-gray-200">Total Plays: {comparison?.totalPlays2 ?? 0}</div>
                <div className="text-gray-200">Best Score: {comparison?.bestScore2.toLocaleString()}</div>
                <div className="text-gray-200">Machines Led: {comparison?.machinesLed2}</div>
              </div>
            </div>

            {/* Deep comparisons */}
            <div>
              <h4 className="text-lg font-bold text-blue-300 mb-3 text-center">Machine Showdowns</h4>
              <div className="space-y-4">
                {comparison?.machineStats.map((m) => (
                  <div key={m.mName} className="rounded-lg border border-gray-700 bg-gray-900/50 p-4">
                    <h5 className="font-semibold text-amber-300 mb-2">{m.mName}</h5>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div
                        className={`p-2 rounded ${m.p1Best > m.p2Best ? "bg-amber-500 text-black" : "bg-gray-800 text-gray-200"}`}
                      >
                        <div className="font-semibold">{player1.name}</div>
                        <div>Best: {m.p1Best ? m.p1Best.toLocaleString() : "—"}</div>
                        <div>Plays: {m.p1Plays}</div>
                      </div>
                      <div
                        className={`p-2 rounded ${m.p2Best > m.p1Best ? "bg-amber-500 text-black" : "bg-gray-800 text-gray-200"}`}
                      >
                        <div className="font-semibold">{player2.name}</div>
                        <div>Best: {m.p2Best ? m.p2Best.toLocaleString() : "—"}</div>
                        <div>Plays: {m.p2Plays}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </FormContainer>
    </div>
  );
}

