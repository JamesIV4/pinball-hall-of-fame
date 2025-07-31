interface Props {
  totalMachines: number;
  totalPlayers: number;
}
export default function Home({ totalMachines, totalPlayers }: Props) {
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center">
      <h2 className="text-2xl font-bold mb-4 text-amber-400">Welcome!</h2>
      <p className="text-gray-300">
        Use the navigation above to manage machines, players &amp; high scores.
      </p>
      <div className="mt-6 flex justify-center gap-4">
        <div className="p-4 bg-gray-700 rounded-lg">
          <p className="text-xl font-bold">{totalMachines}</p>
          <p className="text-sm text-gray-400">Machines</p>
        </div>
        <div className="p-4 bg-gray-700 rounded-lg">
          <p className="text-xl font-bold">{totalPlayers}</p>
          <p className="text-sm text-gray-400">Players</p>
        </div>
      </div>
    </div>
  );
}
