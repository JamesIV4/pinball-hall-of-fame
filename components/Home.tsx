import Image from "next/image";
import { Dispatch, SetStateAction } from "react";
import { View } from "../types/types";

interface Props {
  totalMachines: number;
  totalPlayers: number;
  setView: Dispatch<SetStateAction<View>>;
}
export default function Home({ totalMachines, totalPlayers, setView }: Props) {
  return (
    <>
      <div className="flex justify-center my-6">
        <Image
          src="imgs/pinball-icon-512.png"
          alt="Pinball Icon"
          width={256}
          height={256}
          className="rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setView("highScores")}
        />
      </div>
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-bold mb-4 text-amber-400">Welcome!</h2>
        <p className="text-gray-300">
          Use the navigation above to manage machines, players &amp; high
          scores.
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
    </>
  );
}
