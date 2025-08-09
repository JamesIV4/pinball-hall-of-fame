import FormContainer from "./ui/FormContainer";
import PlayerScoreSection from "./ui/PlayerScoreSection";
import { useFirebaseData } from "../hooks/useFirebaseData";

export default function AllScores() {
  const { machines, players } = useFirebaseData();

  return (
    <FormContainer title="All Scores">
      {players.length === 0 ? (
        <p className="text-gray-400">No players found.</p>
      ) : (
        <div className="space-y-8">
          {players.map((player) => (
            <PlayerScoreSection key={player.id} player={player} machines={machines} />
          ))}
        </div>
      )}
    </FormContainer>
  );
}
