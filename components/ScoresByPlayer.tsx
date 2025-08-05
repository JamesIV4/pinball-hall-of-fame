import { useEffect, useState } from "react";
import FormContainer from "./ui/FormContainer";
import Select from "./ui/Select";
import MachineInfo from "./ui/MachineInfo";
import ScoreList from "./ui/ScoreList";
import { useFirebaseData } from "../hooks/useFirebaseData";

export default function ScoresByPlayer() {
  const { machines, players } = useFirebaseData();
  const [playerId, setPlayerId] = useState("");

  useEffect(() => {
    if (!playerId && players.length) {
      setPlayerId(players[0].id);
    }
  }, [players, playerId]);

  const player = players.find((p) => p.id === playerId);
  const machineNames = Object.keys(player?.scores || {}).sort();

  return (
    <FormContainer title="High Scores by Player">
      <Select
        value={playerId}
        onChange={(e) => setPlayerId(e.target.value)}
        options={players.map((p) => ({ value: p.id, label: p.name }))}
        placeholder="-- select --"
        className="mb-6"
      />

      {playerId &&
        (!machineNames.length ? (
          <p className="text-gray-400">No scores recorded for {player?.name} yet.</p>
        ) : (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-amber-300">Scores for {player?.name}</h3>
            {machineNames.map((mName) => {
              const machine = machines.find((m) => m.name === mName);
              const scores = [...(player?.scores?.[mName] || [])].sort((a, b) => b.score - a.score);
              return (
                <div key={mName} className="bg-gray-700 p-4 rounded-lg">
                  <div className="mb-3">
                    {machine ? (
                      <MachineInfo machine={machine} imageSize="md" />
                    ) : (
                      <h4 className="text-lg font-semibold text-amber-200">{mName}</h4>
                    )}
                  </div>
                  <ScoreList scores={scores} />
                </div>
              );
            })}
          </div>
        ))}
    </FormContainer>
  );
}
