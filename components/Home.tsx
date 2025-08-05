import Image from "next/image";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { getFirebase } from "@/lib/firebase";
import { View, Player, Machine } from "../types/types";

interface Props {
  totalMachines: number;
  totalPlayers: number;
  setView: Dispatch<SetStateAction<View>>;
}

export default function Home({ totalMachines, totalPlayers, setView }: Props) {
  const { db } = getFirebase();
  const [players, setPlayers] = useState<Player[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [stats, setStats] = useState({
    totalScores: 0,
    highestScore: 0,
    topPlayer: "",
    topMachine: "",
    recentScores: 0,
  });
  const [weeklyStats, setWeeklyStats] = useState({
    weeklyHighScore: 0,
    weeklyTopPlayer: "",
    weeklyTopMachine: "",
    weeklyPlayerCount: 0,
    weeklyMachineCount: 0,
    weeklyAvgScore: 0,
  });

  useEffect(() => {
    const unsubP = onSnapshot(collection(db, "data/players/players"), (snap) => {
      setPlayers(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
    const unsubM = onSnapshot(collection(db, "data/machines/machines"), (snap) => {
      setMachines(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    });
    return () => {
      unsubP();
      unsubM();
    };
  }, [db]);

  useEffect(() => {
    if (!players.length) return;

    let totalScores = 0;
    let highestScore = 0;
    let topPlayer = "";
    let topMachine = "";
    let recentScores = 0;
    const playerScoreCounts: Record<string, number> = {};
    const machineScoreCounts: Record<string, number> = {};
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    players.forEach((player) => {
      if (!player.scores) return;

      Object.entries(player.scores).forEach(([machine, scores]) => {
        scores.forEach((score) => {
          totalScores++;
          playerScoreCounts[player.name] = (playerScoreCounts[player.name] || 0) + 1;
          machineScoreCounts[machine] = (machineScoreCounts[machine] || 0) + 1;

          if (score.score > highestScore) {
            highestScore = score.score;
            topPlayer = player.name;
            topMachine = machine;
          }

          if (score.timestamp && new Date(score.timestamp) > weekAgo) {
            recentScores++;
          }
        });
      });
    });

    const mostActivePlayer = Object.entries(playerScoreCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || "";
    const mostPopularMachine = Object.entries(machineScoreCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || "";

    setStats({
      totalScores,
      highestScore,
      topPlayer: mostActivePlayer,
      topMachine: mostPopularMachine,
      recentScores,
    });

    // Calculate weekly stats
    let weeklyHighScore = 0;
    let weeklyTopPlayer = "";
    const weeklyPlayerCounts: Record<string, number> = {};
    const weeklyMachineCounts: Record<string, number> = {};
    const weeklyScores: number[] = [];

    players.forEach((player) => {
      if (!player.scores) return;

      Object.entries(player.scores).forEach(([machine, scores]) => {
        scores.forEach((score) => {
          if (score.timestamp && new Date(score.timestamp) > weekAgo) {
            weeklyScores.push(score.score);
            weeklyPlayerCounts[player.name] = (weeklyPlayerCounts[player.name] || 0) + 1;
            weeklyMachineCounts[machine] = (weeklyMachineCounts[machine] || 0) + 1;

            if (score.score > weeklyHighScore) {
              weeklyHighScore = score.score;
              weeklyTopPlayer = player.name;
            }
          }
        });
      });
    });

    // Find hottest machine by number of plays this week
    const weeklyTopMachine = Object.entries(weeklyMachineCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || "";

    const weeklyAvgScore =
      weeklyScores.length > 0 ? Math.round(weeklyScores.reduce((a, b) => a + b, 0) / weeklyScores.length) : 0;

    setWeeklyStats({
      weeklyHighScore,
      weeklyTopPlayer,
      weeklyTopMachine,
      weeklyPlayerCount: Object.keys(weeklyPlayerCounts).length,
      weeklyMachineCount: Object.keys(weeklyMachineCounts).length,
      weeklyAvgScore,
    });
  }, [players]);

  return (
    <>
      <div className="flex justify-center my-6">
        <Image
          src="imgs/pinball-icon-512.png"
          alt="Pinball Icon"
          width={256}
          height={256}
          className="rounded-lg cursor-pointer hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/20"
          onClick={() => setView("highScores")}
        />
      </div>

      <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-lg shadow-lg text-center border border-gray-700">
        <h2 className="text-3xl font-bold mb-2 text-amber-400 bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
          Pinball Hall of Fame
        </h2>
        <p className="text-gray-300 mb-6">Track your legendary scores and dominate the silver ball!</p>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div
            onClick={() => setView("highScores")}
            className="p-4 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg border border-gray-600 hover:border-amber-500/50 transition-all cursor-pointer hover:scale-105"
          >
            <div className="text-[22px] font-bold text-amber-400">{totalMachines}</div>
            <div className="text-sm text-gray-400">Machines</div>
          </div>
          <div
            onClick={() => setView("scoresByPlayer")}
            className="p-4 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg border border-gray-600 hover:border-blue-500/50 transition-all cursor-pointer hover:scale-105"
          >
            <div className="text-[22px] font-bold text-blue-400">{totalPlayers}</div>
            <div className="text-sm text-gray-400">Players</div>
          </div>
          <div
            onClick={() => setView("highScores")}
            className="p-4 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg border border-gray-600 hover:border-green-500/50 transition-all cursor-pointer hover:scale-105"
          >
            <div className="text-[22px] font-bold text-green-400">{stats.totalScores.toLocaleString()}</div>
            <div className="text-sm text-gray-400">Total Scores</div>
          </div>
          <div
            onClick={() => setView("highScoresWeekly")}
            className="p-4 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg border border-gray-600 hover:border-purple-500/50 transition-all cursor-pointer hover:scale-105"
          >
            <div className="text-[22px] font-bold text-purple-400">{stats.recentScores}</div>
            <div className="text-sm text-gray-400">This Week</div>
          </div>
        </div>

        {/* Featured Stats */}
        {stats.highestScore > 0 && (
          <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 rounded-lg p-4 pb-6 mb-4">
            <h3 className="text-[22px] font-bold text-amber-400 mb-4">🏆 Hall of Fame</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-[22px] mb-1 font-bold text-amber-300">{stats.highestScore.toLocaleString()}</div>
                <div className="text-gray-400">Highest Score</div>
              </div>
              <div className="text-center">
                <div className="text-[22px] mb-1 font-bold text-blue-300">{stats.topPlayer}</div>
                <div className="text-gray-400">Top Player</div>
              </div>
              <div className="text-center">
                <div className="text-[22px] mb-1 font-bold text-green-300">{stats.topMachine}</div>
                <div className="text-gray-400">Most Popular</div>
              </div>
            </div>
          </div>
        )}

        {/* Weekly Highlights */}
        {stats.recentScores > 0 && (
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-4 pb-6 mb-4">
            <h3 className="text-[22px] font-bold text-blue-400 mb-6">⚡ This Week's Highlights</h3>
            <div className="text-sm space-y-4 md:space-y-8">
              <div className="flex flex-col md:flex-row md:justify-around space-y-4 md:space-y-0">
                <div className="text-center">
                  <div className="text-[22px] mb-1 font-bold text-blue-300">
                    {weeklyStats.weeklyHighScore.toLocaleString()}
                  </div>
                  <div className="text-gray-400">Weekly High</div>
                  <div className="text-xs text-blue-200">{weeklyStats.weeklyTopPlayer}</div>
                </div>
                <div className="text-center">
                  <div className="text-[22px] mb-1 font-bold text-green-300">
                    {weeklyStats.weeklyAvgScore.toLocaleString()}
                  </div>
                  <div className="text-gray-400">Avg Score</div>
                </div>
                <div className="text-center">
                  <div className="text-[22px] mb-1 font-bold text-purple-300">{weeklyStats.weeklyPlayerCount}</div>
                  <div className="text-gray-400">Active Players</div>
                </div>
              </div>
              <div className="flex flex-col md:flex-row md:justify-around space-y-4 md:space-y-0">
                <div className="text-center">
                  <div className="text-[22px] mb-1 font-bold text-yellow-300">{weeklyStats.weeklyMachineCount}</div>
                  <div className="text-gray-400">Machines Played</div>
                </div>
                <div className="text-center">
                  <div className="text-[22px] mb-1 font-bold text-orange-300">{weeklyStats.weeklyTopMachine}</div>
                  <div className="text-gray-400">Hottest Machine</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          <button
            onClick={() => setView("addScore")}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-semibold rounded-lg hover:from-amber-400 hover:to-yellow-500 transition-all duration-200 transform hover:scale-105"
          >
            🎯 Add Score
          </button>
          <button
            onClick={() => setView("highScores")}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-500 hover:to-blue-600 transition-all duration-200 transform hover:scale-105"
          >
            🏆 High Scores
          </button>
          <button
            onClick={() => setView("managePlayers")}
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg hover:from-green-500 hover:to-green-600 transition-all duration-200 transform hover:scale-105"
          >
            👤 Add Player
          </button>
        </div>
      </div>
    </>
  );
}
