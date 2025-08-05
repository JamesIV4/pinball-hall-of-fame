import { Player, Machine, ScoreEntry } from "../../types/types";
import MachineInfo from "./MachineInfo";
import ScoreList from "./ScoreList";

interface PlayerScoreSectionProps {
  player: Player;
  machines: Machine[];
  showActions?: boolean;
  onEditScore?: (playerId: string, machineName: string, score: ScoreEntry, index: number) => void;
  onDeleteScore?: (playerId: string, machineName: string, score: ScoreEntry, index: number) => void;
}

export default function PlayerScoreSection({ 
  player, 
  machines, 
  showActions = false, 
  onEditScore, 
  onDeleteScore 
}: PlayerScoreSectionProps) {
  const machineNames = Object.keys(player.scores || {}).sort();

  if (machineNames.length === 0) {
    return (
      <div className="bg-gray-700 p-4 rounded-lg">
        <h3 className="text-xl font-bold text-amber-300 mb-2">{player.name}</h3>
        <p className="text-gray-400">No scores recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-700 p-4 rounded-lg">
      <h3 className="text-xl font-bold text-amber-300 mb-4">{player.name}</h3>
      <div className="space-y-4">
        {machineNames.map((machineName) => {
          const machine = machines.find((m) => m.name === machineName);
          const scores = [...(player.scores?.[machineName] || [])].sort((a, b) => b.score - a.score);
          
          return (
            <div key={machineName} className="bg-gray-600 p-3 rounded-lg">
              <div className="mb-3">
                {machine ? (
                  <MachineInfo machine={machine} />
                ) : (
                  <h4 className="text-lg font-semibold text-amber-200">{machineName}</h4>
                )}
              </div>
              <ScoreList
                scores={scores}
                showActions={showActions}
                onEdit={showActions ? (score, index) => onEditScore?.(player.id, machineName, score, index) : undefined}
                onDelete={showActions ? (score, index) => onDeleteScore?.(player.id, machineName, score, index) : undefined}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}