import Image from "next/image";
import { Dispatch, SetStateAction, useMemo } from "react";
import { Machine, Player, View } from "../types/types";
import { formatWeekRange, getCurrentWeek, isInCurrentWeek } from "../utils/weekUtils";

interface Props {
  players: Player[];
  machines: Machine[];
  setView: Dispatch<SetStateAction<View>>;
}

type ScoreEvent = {
  playerName: string;
  machineName: string;
  value: number;
  timestamp?: string;
};

function formatTimeAgo(timestamp: string): string {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

export default function Home({ players, machines, setView }: Props) {
  const {
    totalMachines,
    totalPlayers,
    totalScores,
    overallHigh,
    weeklyHigh,
    weeklyCount,
    weeklyAvg,
    weeklyPlayerCount,
    weeklyMachineCount,
    weeklyTopMachine,
    recentActivity,
    topPlayersWeekly,
    topMachinesWeekly,
    topMachinesOverall,
  } = useMemo(() => {
    const scoreEvents: ScoreEvent[] = [];
    for (const player of players) {
      if (!player.scores) continue;
      for (const [machineName, scoreList] of Object.entries(player.scores)) {
        for (const entry of scoreList) {
          scoreEvents.push({
            playerName: player.name,
            machineName,
            value: entry.score,
            timestamp: entry.timestamp,
          });
        }
      }
    }

    const totalScores = scoreEvents.length;

    // Overall high score
    let overallHigh: ScoreEvent | undefined;
    for (const ev of scoreEvents) {
      if (!overallHigh || ev.value > overallHigh.value) overallHigh = ev;
    }

    // Overall machine stats (most played + highest score per machine)
    const overallMachineCounts = new Map<string, number>();
    const overallMachineHigh = new Map<string, { value: number; playerName: string }>();
    for (const ev of scoreEvents) {
      overallMachineCounts.set(ev.machineName, (overallMachineCounts.get(ev.machineName) || 0) + 1);
      const currHigh = overallMachineHigh.get(ev.machineName);
      if (!currHigh || ev.value > currHigh.value) {
        overallMachineHigh.set(ev.machineName, { value: ev.value, playerName: ev.playerName });
      }
    }
    const topMachinesOverall = Array.from(overallMachineCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([machineName, playCount]) => ({
        machineName,
        playCount,
        highScore: overallMachineHigh.get(machineName)?.value || 0,
        highPlayer: overallMachineHigh.get(machineName)?.playerName,
      }));

    // Weekly stats
    const weeklyEvents = scoreEvents.filter((ev) => ev.timestamp && isInCurrentWeek(ev.timestamp));
    let weeklyHigh: ScoreEvent | undefined;
    let weeklySum = 0;
    const weeklyPlayerCounts = new Map<string, number>();
    const weeklyMachineCounts = new Map<string, number>();
    for (const ev of weeklyEvents) {
      weeklySum += ev.value;
      if (!weeklyHigh || ev.value > weeklyHigh.value) weeklyHigh = ev;
      weeklyPlayerCounts.set(ev.playerName, (weeklyPlayerCounts.get(ev.playerName) || 0) + 1);
      weeklyMachineCounts.set(ev.machineName, (weeklyMachineCounts.get(ev.machineName) || 0) + 1);
    }
    const weeklyAvg = weeklyEvents.length ? Math.round(weeklySum / weeklyEvents.length) : 0;

    const topPlayersWeekly = Array.from(weeklyPlayerCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const topMachinesWeekly = Array.from(weeklyMachineCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const weeklyTopMachine = topMachinesWeekly[0]?.[0] || "";

    const recentActivity = scoreEvents
      .filter((ev) => ev.timestamp)
      .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime())
      .slice(0, 8);

    return {
      totalMachines: machines.length,
      totalPlayers: players.length,
      totalScores,
      overallHigh,
      weeklyHigh,
      weeklyCount: weeklyEvents.length,
      weeklyAvg,
      weeklyPlayerCount: weeklyPlayerCounts.size,
      weeklyMachineCount: weeklyMachineCounts.size,
      weeklyTopMachine,
      recentActivity,
      topPlayersWeekly,
      topMachinesWeekly,
      topMachinesOverall,
    };
  }, [players, machines]);

  const weekRangeLabel = formatWeekRange(getCurrentWeek());
  const machineByName = useMemo(() => {
    const map = new Map<string, Machine>();
    for (const m of machines) {
      map.set(m.name.toLowerCase(), m);
    }
    return map;
  }, [machines]);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-xl border border-gray-700 bg-gradient-to-br from-gray-800 to-gray-900 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-wide text-amber-400">Pinball Hall of Fame</h2>
            <p className="text-gray-300 mt-1">Track epic highs, weekly rivalries, and glorious tilts.</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 rounded bg-gray-700 border border-gray-600 text-gray-200">
                {totalMachines} machines
              </span>
              <span className="px-2 py-1 rounded bg-gray-700 border border-gray-600 text-gray-200">
                {totalPlayers} players
              </span>
              <span className="px-2 py-1 rounded bg-gray-700 border border-gray-600 text-gray-200">
                {totalScores.toLocaleString()} scores
              </span>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setView("addScore")}
                className="px-4 py-2 rounded-lg bg-amber-500 text-black font-semibold hover:bg-amber-400 transition-colors"
              >
                🎯 Add Score
              </button>
              <button
                onClick={() => setView("highScoresWeekly")}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors"
              >
                ⚡ Weekly
              </button>
              <button
                onClick={() => setView("highScores")}
                className="px-4 py-2 rounded-lg bg-gray-700 text-white font-semibold hover:bg-gray-600 transition-colors"
              >
                🏆 All-Time
              </button>
            </div>
          </div>
          <div className="self-center">
            <Image
              src="imgs/pinball-icon-512.png"
              alt="Pinball Icon"
              width={160}
              height={160}
              className="rounded-lg shadow-lg shadow-amber-500/10"
            />
          </div>
        </div>
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div
          onClick={() => setView("highScores")}
          className="cursor-pointer rounded-lg border border-gray-700 bg-gray-800 p-4 hover:border-amber-500/50 transition-colors"
        >
          <div className="text-xs text-gray-400">Machines</div>
          <div className="text-2xl font-bold text-amber-400">{totalMachines}</div>
        </div>
        <div
          onClick={() => setView("scoresByPlayer")}
          className="cursor-pointer rounded-lg border border-gray-700 bg-gray-800 p-4 hover:border-blue-500/50 transition-colors"
        >
          <div className="text-xs text-gray-400">Players</div>
          <div className="text-2xl font-bold text-blue-400">{totalPlayers}</div>
        </div>
        <div
          onClick={() => setView("highScores")}
          className="cursor-pointer rounded-lg border border-gray-700 bg-gray-800 p-4 hover:border-green-500/50 transition-colors"
        >
          <div className="text-xs text-gray-400">Total Scores</div>
          <div className="text-2xl font-bold text-green-400">{totalScores.toLocaleString()}</div>
        </div>
        <div
          onClick={() => setView("highScoresWeekly")}
          className="cursor-pointer rounded-lg border border-gray-700 bg-gray-800 p-4 hover:border-purple-500/50 transition-colors"
        >
          <div className="text-xs text-gray-400">This Week</div>
          <div className="text-2xl font-bold text-purple-400">{weeklyCount}</div>
        </div>
      </div>

      {/* Hall of Fame: Top Tables (cards with images) */}
      {topMachinesOverall.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-amber-300 mb-2">🏆 Hall of Fame</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topMachinesOverall.map((m, idx) => {
              const machine = machineByName.get(m.machineName.toLowerCase());
              const imgSrc = machine?.image || "imgs/pinball-icon-512.png";
              return (
                <div
                  key={m.machineName}
                  className="overflow-hidden rounded-xl border border-amber-500/30 bg-amber-500/5"
                >
                  <div className="relative h-32 w-full bg-gray-900">
                    <Image src={imgSrc} alt={m.machineName} fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded bg-black/40 border border-amber-500/40 text-amber-100">
                        <span className="opacity-80">#{idx + 1}</span>
                        <span className="truncate">{m.machineName}</span>
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-black/40 border border-amber-500/40 text-amber-100">
                        {m.playCount} {m.playCount === 1 ? "play" : "plays"}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 flex items-baseline justify-between gap-3">
                    <div className="text-xs text-amber-200/70">Top score</div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-dotmatrix text-[22px] md:text-[26px] leading-none text-amber-300">
                        {m.highScore.toLocaleString()}
                      </span>
                      {m.highPlayer && <span className="text-xs text-amber-100/60 truncate">by {m.highPlayer}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Weekly Highlights */}
      <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-lg font-bold text-blue-300">⚡ This Week</h3>
          <div className="text-xs text-blue-200">{weekRangeLabel}</div>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
          <div className="text-center rounded bg-gray-800/60 p-3 border border-gray-700">
            <div className="text-gray-400">Weekly High</div>
            <div className="text-xl font-bold text-blue-200">{weeklyHigh ? weeklyHigh.value.toLocaleString() : 0}</div>
          </div>
          <div className="text-center rounded bg-gray-800/60 p-3 border border-gray-700">
            <div className="text-gray-400">Avg Score</div>
            <div className="text-xl font-bold text-green-200">{weeklyAvg.toLocaleString()}</div>
          </div>
          <div className="text-center rounded bg-gray-800/60 p-3 border border-gray-700">
            <div className="text-gray-400">Active Players</div>
            <div className="text-xl font-bold text-purple-200">{weeklyPlayerCount}</div>
          </div>
          <div className="text-center rounded bg-gray-800/60 p-3 border border-gray-700">
            <div className="text-gray-400">Machines Played</div>
            <div className="text-xl font-bold text-yellow-200">{weeklyMachineCount}</div>
          </div>
          <div className="text-center rounded bg-gray-800/60 p-3 border border-gray-700">
            <div className="text-gray-400">Hottest Machine</div>
            <div className="text-xl font-bold text-orange-200">{weeklyTopMachine || "—"}</div>
          </div>
        </div>
      </div>

      {/* Live feed and Leaderboards */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Recent Activity */}
        <div className="md:col-span-2 rounded-lg border border-gray-700 bg-gray-800 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-200">🎮 Recent Activity</h3>
            <button onClick={() => setView("allRecentScores")} className="text-xs text-gray-400 hover:text-gray-200">
              View all
            </button>
          </div>
          {recentActivity.length === 0 ? (
            <div className="text-sm text-gray-400 mt-3">No recent scores yet. Be the first!</div>
          ) : (
            <ul className="mt-3 divide-y divide-gray-700/60">
              {recentActivity.map((ev, idx) => (
                <li key={idx} className="py-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded bg-gray-700 text-gray-300 border border-gray-600">
                      🕹️
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm text-gray-200 truncate">
                        <span className="font-semibold text-blue-200">{ev.playerName}</span>
                        <span className="mx-1 text-gray-400">scored</span>
                        <span className="font-semibold text-amber-200">{ev.value.toLocaleString()}</span>
                        <span className="mx-1 text-gray-400">on</span>
                        <span className="text-green-200">{ev.machineName}</span>
                      </div>
                      {ev.timestamp && <div className="text-xs text-gray-400">{formatTimeAgo(ev.timestamp)}</div>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Leaderboards */}
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-4 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-gray-200">🏅 Top Players (This Week)</h3>
            {topPlayersWeekly.length === 0 ? (
              <div className="text-sm text-gray-400 mt-2">No plays yet this week.</div>
            ) : (
              <ul className="mt-2 space-y-2">
                {topPlayersWeekly.map(([name, count], idx) => {
                  const max = topPlayersWeekly[0][1] || 1;
                  const pct = Math.round((count / max) * 100);
                  return (
                    <li key={name} className="text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-200">
                          {idx + 1}. {name}
                        </span>
                        <span className="text-gray-400">{count}</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded bg-gray-700">
                        <div className="h-1.5 rounded bg-blue-500" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-200">🔥 Trending Machines</h3>
            {topMachinesWeekly.length === 0 ? (
              <div className="text-sm text-gray-400 mt-2">No plays yet this week.</div>
            ) : (
              <ul className="mt-2 space-y-2">
                {topMachinesWeekly.map(([name, count], idx) => {
                  const max = topMachinesWeekly[0][1] || 1;
                  const pct = Math.round((count / max) * 100);
                  return (
                    <li key={name} className="text-sm">
                      <div className="flex justify-between">
                        <span className="text-green-200">
                          {idx + 1}. {name}
                        </span>
                        <span className="text-gray-400">{count}</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded bg-gray-700">
                        <div className="h-1.5 rounded bg-green-500" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
