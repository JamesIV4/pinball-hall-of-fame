import { useEffect, useMemo, useRef, useState } from "react";
import FormContainer from "./ui/FormContainer";
import Select from "./ui/Select";
import MachineInfo from "./ui/MachineInfo";
import ScoreList from "./ui/ScoreList";
import { useFirebaseData } from "../hooks/useFirebaseData";
import { safeGetItem, safeRemoveItem, safeSetItem } from "../utils/storage";
import { goToHighScoresForMachine, goToPlayerStatsForPlayer, PREFILL_PLAYER_KEY } from "../utils/navigation";
import { ScoreEntry } from "../types/types";
import { getWeekStart, isInCurrentWeek, formatWeekRange } from "../utils/weekUtils";

export default function PlayerStats() {
  const { machines, players } = useFirebaseData();
  const [playerId, setPlayerId] = useState("");
  const [expandedMachines, setExpandedMachines] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!playerId && players.length) {
      // Prefill from localStorage if present, otherwise default to first player
      const prefill = safeGetItem(PREFILL_PLAYER_KEY);
      if (prefill && players.some((p) => p.id === prefill)) {
        setPlayerId(prefill);
        safeRemoveItem(PREFILL_PLAYER_KEY);
        return;
      }
      setPlayerId(players[0].id);
    }
  }, [players, playerId]);

  const player = players.find((p) => p.id === playerId);

  const machineNames = useMemo(() => {
    return Object.keys(player?.scores || {}).sort();
  }, [player]);

  const stats = useMemo(() => {
    if (!player) return null;

    let totalPlays = 0;
    let bestScore = 0;
    let lastPlayed: string | null = null;
    const machineCounts = new Map<string, number>();
    const allTimestamps: string[] = [];

    for (const [mName, scores] of Object.entries(player.scores || {})) {
      machineCounts.set(mName, (machineCounts.get(mName) || 0) + scores.length);
      for (const s of scores) {
        totalPlays += 1;
        if (s.timestamp) {
          allTimestamps.push(s.timestamp);
          if (!lastPlayed || new Date(s.timestamp) > new Date(lastPlayed)) {
            lastPlayed = s.timestamp;
          }
        }
        if (s.score > bestScore) bestScore = s.score;
      }
    }

    const topMachines = Array.from(machineCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Weekly activity for the last 12 weeks (oldest -> newest)
    const weeks = 12;
    const now = new Date();
    const currentWeekStart = getWeekStart(now);
    const weekStarts: Date[] = [];
    for (let i = 0; i < weeks; i++) {
      const d = new Date(currentWeekStart);
      d.setDate(d.getDate() - (weeks - 1 - i) * 7);
      weekStarts.push(d);
    }
    const weeklyCounts = new Array(weeks).fill(0);
    for (const ts of allTimestamps) {
      const ws = getWeekStart(new Date(ts));
      const idx = weekStarts.findIndex((w) => w.getTime() === ws.getTime());
      if (idx >= 0) weeklyCounts[idx] += 1;
    }

    // plays per week = average of last 4 weeks
    const last4 = weeklyCounts.slice(-4);
    const playsPerWeek = last4.length ? Math.round((last4.reduce((a, b) => a + b, 0) / last4.length) * 10) / 10 : 0;

    return { totalPlays, bestScore, lastPlayed, topMachines, weeklyCounts, playsPerWeek, weekStarts };
  }, [player]);

  // ─────────────────────────────────────────────────────────────
  // Medal calculations: all-time (per machine) and weekly (per machine per week)
  // ─────────────────────────────────────────────────────────────
  const medals = useMemo(() => {
    if (!playerId)
      return {
        allTime: [] as { color: "gold" | "silver" | "bronze"; machine: string }[],
        weekly: [] as { color: "gold" | "silver" | "bronze"; machine: string; weekStart: Date }[],
      };

    const allMachineNames = new Set<string>();
    // Prefer canonical set from machines list; also include any ad-hoc keys from player docs
    for (const m of machines) allMachineNames.add(m.name);
    for (const p of players) for (const key of Object.keys(p.scores || {})) allMachineNames.add(key);

    const allTime: { color: "gold" | "silver" | "bronze"; machine: string }[] = [];
    const weekly: { color: "gold" | "silver" | "bronze"; machine: string; weekStart: Date }[] = [];

    for (const mName of Array.from(allMachineNames)) {
      // All-time best per player on this machine
      const bestByPlayer = players
        .map((p) => {
          const list = p.scores?.[mName] || [];
          const best = list.reduce((mx, s) => (s.score > mx ? s.score : mx), 0);
          return { playerId: p.id, best };
        })
        .filter((x) => x.best > 0)
        .sort((a, b) => b.best - a.best);
      const idx = bestByPlayer.findIndex((x) => x.playerId === playerId);
      if (idx >= 0 && idx <= 2) {
        const color = idx === 0 ? "gold" : idx === 1 ? "silver" : "bronze";
        allTime.push({ color, machine: mName });
      }

      // Weekly: bucket scores by ISO week start (using project weekUtils)
      const weekBuckets = new Map<number, { playerId: string; score: number }[]>();
      for (const p of players) {
        const list = p.scores?.[mName] || [];
        for (const s of list) {
          if (!s.timestamp) continue;
          const ws = getWeekStart(new Date(s.timestamp)).getTime();
          if (!weekBuckets.has(ws)) weekBuckets.set(ws, []);
          weekBuckets.get(ws)!.push({ playerId: p.id, score: s.score });
        }
      }

      for (const [ws, entries] of weekBuckets.entries()) {
        // best per player for the week
        const map = new Map<string, number>();
        for (const e of entries) {
          map.set(e.playerId, Math.max(map.get(e.playerId) || 0, e.score));
        }
        const ranked = Array.from(map.entries())
          .map(([pid, best]) => ({ playerId: pid, best }))
          .filter((x) => x.best > 0)
          .sort((a, b) => b.best - a.best);
        const wIdx = ranked.findIndex((x) => x.playerId === playerId);
        if (wIdx >= 0 && wIdx <= 2) {
          const color = wIdx === 0 ? "gold" : wIdx === 1 ? "silver" : "bronze";
          weekly.push({ color, machine: mName, weekStart: new Date(ws) });
        }
      }
    }

    // Sort for stable display: all-time by machine name; weekly by week then machine
    allTime.sort((a, b) => a.machine.localeCompare(b.machine));
    weekly.sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime() || a.machine.localeCompare(b.machine));

    return { allTime, weekly };
  }, [players, machines, playerId]);

  function medalClasses(color: "gold" | "silver" | "bronze") {
    if (color === "gold") return "badge-gold";
    if (color === "silver") return "badge-silver";
    return "badge-bronze";
  }

  function formatWeekOf(d: Date) {
    return `${d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;
  }

  function placeLabel(color: "gold" | "silver" | "bronze") {
    return color === "gold" ? "1st Place" : color === "silver" ? "2nd Place" : "3rd Place";
  }

  // Small helper to add a bottom fade for scrollable medal lists
  function ScrollableWithBottomFade({
    className = "",
    fromColor = "rgba(26, 35, 47, 1)",
    toColor = "rgba(26, 35, 47, 0)",
    children,
  }: {
    className?: string;
    fromColor?: string;
    toColor?: string;
    children: React.ReactNode;
  }) {
    const ref = useRef<HTMLDivElement | null>(null);
    const [showFade, setShowFade] = useState(false);

    useEffect(() => {
      const el = ref.current;
      if (!el) return;

      const update = () => {
        const overflow = el.scrollHeight > el.clientHeight + 1;
        const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
        setShowFade(overflow && !atBottom);
      };

      update();
      const onScroll = () => update();
      const onResize = () => update();
      el.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onResize);

      return () => {
        el.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onResize);
      };
    }, []);

    return (
      <div className="relative">
        <div ref={ref} className={className}>
          {children}
        </div>
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-14"
          style={{
            backgroundImage: `linear-gradient(to top, ${fromColor} 0%, ${toColor} 100%)`,
            opacity: showFade ? 1 : 0,
            transition: "opacity 200ms ease",
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <FormContainer title="Player Stats">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left: main content */}
          <div className="flex-1 order-2 md:order-1">
            <div className="mb-3 hidden md:block">
              <Select
                value={playerId}
                onChange={(e) => setPlayerId(e.target.value)}
                options={players.map((p) => ({ value: p.id, label: p.name }))}
                placeholder="-- select player --"
              />
            </div>

            {!playerId ? (
              <p className="text-gray-400">No player selected.</p>
            ) : !machineNames.length ? (
              <p className="text-gray-400">No scores recorded for {player?.name} yet.</p>
            ) : (
              <div className="space-y-4">
                {/* Medals section */}
                <div className="overflow-hidden rounded-xl border border-gray-700 bg-gradient-to-br from-gray-800/60 to-gray-900/60">
                  <div className="p-3 border-b border-gray-700/60">
                    <h3 className="text-sm font-bold text-amber-300">Medals</h3>
                  </div>
                  <div className="p-3 grid md:grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-gray-400 mb-2">All-Time Podiums</div>
                      <ScrollableWithBottomFade className="max-h-56 overflow-auto pr-1 space-y-2">
                        {medals.allTime.length ? (
                          medals.allTime.map((m, i) => (
                            <div
                              key={`${m.machine}-${i}`}
                              className={`rounded-lg border px-3 py-2 text-center badge-embossed ${medalClasses(m.color)}`}
                              title={`${m.color[0].toUpperCase() + m.color.slice(1)} (all-time)`}
                            >
                              <div className="text-xs font-semibold opacity-90 badge-text-engraved">
                                {placeLabel(m.color)}
                              </div>
                              <button
                                className="block w-full font-semibold truncate hover:underline badge-text-engraved"
                                onClick={() => goToHighScoresForMachine(m.machine)}
                              >
                                {m.machine}
                              </button>
                              <div className="text-xs opacity-90 badge-text-engraved">All-Time</div>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-gray-500">No podiums yet.</div>
                        )}
                      </ScrollableWithBottomFade>
                    </div>

                    <div>
                      <div className="text-xs text-gray-400 mb-2">Weekly Podiums</div>
                      <ScrollableWithBottomFade className="max-h-56 overflow-auto pr-1 space-y-2">
                        {medals.weekly.length ? (
                          medals.weekly.map((w, i) => (
                            <div
                              key={`${w.machine}-${w.weekStart.getTime()}-${i}`}
                              className={`rounded-lg border px-3 py-2 text-center badge-embossed ${medalClasses(w.color)}`}
                              title={`${w.color[0].toUpperCase() + w.color.slice(1)} (weekly)`}
                            >
                              <div className="text-xs font-semibold opacity-90 badge-text-engraved">
                                {placeLabel(w.color)}
                              </div>
                              <button
                                className="block w-full font-semibold truncate hover:underline badge-text-engraved"
                                onClick={() => goToHighScoresForMachine(w.machine)}
                              >
                                {w.machine}
                              </button>
                              <div className="text-xs opacity-90 badge-text-engraved">{formatWeekOf(w.weekStart)}</div>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-gray-500">No weekly podiums yet.</div>
                        )}
                      </ScrollableWithBottomFade>
                    </div>
                  </div>
                </div>
                {machineNames.map((mName) => {
                  const machine = machines.find((m) => m.name === mName);
                  const scores = [...(player?.scores?.[mName] || [])].sort((a, b) => b.score - a.score);
                  const lastPlayed = scores.reduce(
                    (acc: string | null, s: ScoreEntry) => {
                      if (!s.timestamp) return acc;
                      return !acc || new Date(s.timestamp) > new Date(acc) ? s.timestamp : acc;
                    },
                    null as string | null,
                  );
                  // median score for this machine (numeric)
                  const median = (() => {
                    if (!scores.length) return null;
                    const vals = scores.map((s) => s.score).sort((a, b) => a - b);
                    const mid = Math.floor(vals.length / 2);
                    return vals.length % 2 === 0 ? Math.round((vals[mid - 1] + vals[mid]) / 2) : vals[mid];
                  })();

                  // compute ranking among all players for this machine
                  const allPlayerBest = players
                    .map((p) => {
                      const list = p.scores?.[mName] || [];
                      const best = list.reduce((mx, s) => (s.score > mx ? s.score : mx), 0);
                      return { playerId: p.id, best };
                    })
                    .filter((x) => x.best > 0)
                    .sort((a, b) => b.best - a.best);
                  const allPlayersCount = allPlayerBest.length;
                  const allIdx = allPlayerBest.findIndex((x) => x.playerId === playerId);
                  const allTimeRank = allIdx >= 0 ? allIdx + 1 : null;

                  // compute weekly ranking (current week) among players for this machine
                  const weeklyPlayerBest = players
                    .map((p) => {
                      const list = (p.scores?.[mName] || []).filter((s) => s.timestamp && isInCurrentWeek(s.timestamp));
                      const best = list.reduce((mx, s) => (s.score > mx ? s.score : mx), 0);
                      return { playerId: p.id, best };
                    })
                    .filter((x) => x.best > 0)
                    .sort((a, b) => b.best - a.best);
                  const weeklyPlayersCount = weeklyPlayerBest.length;
                  const weekIdx = weeklyPlayerBest.findIndex((x) => x.playerId === playerId);
                  const weeklyRank = weekIdx >= 0 ? weekIdx + 1 : null;

                  return (
                    <div
                      key={mName}
                      className="overflow-hidden rounded-xl border border-gray-700 bg-gradient-to-br from-gray-800/60 to-gray-900/60 p-4"
                    >
                      <div>
                        <div className="rounded-lg border border-gray-700/60 bg-gradient-to-r from-gray-800/50 to-gray-900/50 p-3">
                          <div className="flex items-center gap-4">
                            <div className="flex-shrink-0">
                              {machine ? (
                                <MachineInfo machine={machine} imageSize="md" hideName />
                              ) : (
                                <div className="text-lg font-semibold text-amber-200">{mName}</div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h4 className="text-lg font-bold text-amber-300 truncate">
                                <button
                                  className="hover:underline"
                                  onClick={() => goToHighScoresForMachine(mName)}
                                  title="View machine high scores"
                                >
                                  {mName}
                                </button>
                              </h4>
                              <div className="text-sm text-gray-400 mt-1 flex flex-wrap items-center gap-2">
                                <span className="block">
                                  Plays: <span className="font-semibold text-gray-200">{scores.length}</span>
                                </span>
                                <span className="hidden sm:inline">•</span>
                                <span className="block">
                                  Last:{" "}
                                  <span className="text-gray-200">
                                    {lastPlayed ? new Date(lastPlayed).toLocaleDateString() : "—"}
                                  </span>
                                </span>
                                {median !== null && (
                                  <span className="mt-1 sm:mt-0 inline-flex items-center ml-0 sm:ml-1 px-2 py-0.5 rounded-full bg-amber-500 text-black text-xs font-semibold">
                                    Median {median.toLocaleString()}
                                  </span>
                                )}
                              </div>
                              <div className="mt-2 flex items-center gap-2">
                                <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-gray-900/50 border border-gray-700 text-xs text-gray-200">
                                  <div className="text-xs text-gray-400">Rank (week)</div>
                                  <div className="inline-flex items-center px-2 py-0.5 bg-amber-500 text-black rounded text-xs font-semibold">
                                    {weeklyRank ?? "—"}
                                    {weeklyRank ? `/${weeklyPlayersCount}` : ""}
                                  </div>
                                </div>
                                <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-gray-900/50 border border-gray-700 text-xs text-gray-200">
                                  <div className="text-xs text-gray-400">Rank (all)</div>
                                  <div className="inline-flex items-center px-2 py-0.5 bg-blue-500 text-white rounded text-xs font-semibold">
                                    {allTimeRank ?? "—"}
                                    {allTimeRank ? `/${allPlayersCount}` : ""}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Collapse/expand control */}
                        <div className="mt-3">
                          <button
                            type="button"
                            className="w-full flex items-center gap-3 text-center"
                            onClick={() => setExpandedMachines((prev) => ({ ...prev, [mName]: !prev[mName] }))}
                          >
                            <span className="flex-1 h-px bg-gray-700" />
                            <span className="shrink-0 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-900/40 border border-gray-700 text-gray-200 text-sm font-semibold">
                              <span className={`transition-transform ${expandedMachines[mName] ? "rotate-180" : ""}`}>
                                ▾
                              </span>
                              {expandedMachines[mName] ? "Collapse Scores" : "Show Scores"}
                            </span>
                            <span className="flex-1 h-px bg-gray-700" />
                          </button>
                        </div>

                        {/* Scores list (collapsed by default) */}
                        {expandedMachines[mName] && (
                          <div className="mt-4">
                            {scores.length ? (
                              <ScoreList scores={scores} />
                            ) : (
                              <div className="text-sm text-gray-400">No scores for this machine.</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="-mb-5 block md:hidden">
            <Select
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
              options={players.map((p) => ({ value: p.id, label: p.name }))}
              placeholder="-- select player --"
            />
          </div>

          {/* Right: stats panel */}
          <aside className="order-1 md:order-2 md:w-72">
            <div className="sticky top-6 space-y-4">
              <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-blue-300">Player Summary</h3>
                </div>
                {!player ? (
                  <div className="text-sm text-gray-400 mt-3">No player selected.</div>
                ) : (
                  <div className="mt-3 space-y-3 text-sm">
                    <div className="bg-gray-800/60 rounded p-3 border border-gray-700">
                      <div className="text-xs text-gray-400">Total Plays</div>
                      <div className="text-xl font-bold text-amber-300">{stats?.totalPlays ?? 0}</div>
                    </div>

                    <div className="bg-gray-800/60 rounded p-3 border border-gray-700">
                      <div className="text-xs text-gray-400">Machines</div>
                      <div className="text-xl font-bold text-amber-300">{Object.keys(player?.scores || {}).length}</div>
                    </div>

                    <div className="bg-gray-800/60 rounded p-3 border border-gray-700">
                      <div className="text-xs text-gray-400">Medals</div>
                      <div className="text-xl font-bold text-amber-300">
                        {medals.allTime.length + medals.weekly.length}
                      </div>
                    </div>

                    <div className="bg-gray-800/60 rounded p-3 border border-gray-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-gray-400">Plays / week (avg)</div>
                          <div className="text-xl font-bold text-amber-300">{stats?.playsPerWeek ?? 0}</div>
                        </div>

                        <div className="ml-3 w-28 h-10">
                          {stats?.weeklyCounts ? (
                            <svg viewBox="0 0 120 40" className="w-full h-full" preserveAspectRatio="none">
                              <polyline
                                fill="none"
                                stroke="#f6c84c"
                                strokeWidth="2"
                                points={stats.weeklyCounts
                                  .map((v: number, i: number) => {
                                    const max = Math.max(...stats.weeklyCounts);
                                    const x = (i / (stats.weeklyCounts.length - 1)) * 120;
                                    const y = max ? 40 - (v / max) * 36 : 40;
                                    return `${x.toFixed(2)},${y.toFixed(2)}`;
                                  })
                                  .join(" ")}
                                strokeLinejoin="round"
                                strokeLinecap="round"
                              />
                            </svg>
                          ) : (
                            <div className="text-xs text-gray-400">No data</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-800/60 rounded p-3 border border-gray-700">
                      <div className="text-xs text-gray-400">Last Played</div>
                      <div className="text-sm text-gray-300">
                        {stats?.lastPlayed ? new Date(stats.lastPlayed).toLocaleString() : "—"}
                      </div>
                    </div>

                    <div className="bg-gray-800/60 rounded p-3 border border-gray-700">
                      <div className="text-xs text-gray-400">Top Machines</div>
                      <div className="mt-2 space-y-1">
                        {stats?.topMachines.length ? (
                          stats.topMachines.map((m) => (
                            <div key={m.name} className="flex items-center justify-between text-sm text-green-200">
                              <button
                                className="truncate text-left hover:underline"
                                onClick={() => goToHighScoresForMachine(m.name)}
                                title="View machine high scores"
                              >
                                {m.name}
                              </button>
                              <span className="text-gray-300">{m.count}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-400">—</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-gray-700 bg-gray-800 p-3">
                <h4 className="text-sm font-semibold text-gray-200">Quick Actions</h4>
                <div className="mt-3 flex flex-col gap-2">
                  <button
                    className="px-3 py-2 rounded bg-amber-500 text-black font-semibold hover:bg-amber-400"
                    onClick={() => {
                      if (player) {
                        safeSetItem("phof_prefill_player", player.id);
                        window.location.hash = "addScore";
                      }
                    }}
                  >
                    Add Score for Player
                  </button>
                  <button
                    className="px-3 py-2 rounded bg-blue-500 text-black font-semibold hover:bg-blue-400"
                    onClick={() => {
                      if (player) {
                        safeSetItem("phof_compare_player1", player.id);
                        window.location.hash = "comparePlayers";
                      }
                    }}
                  >
                    Compare Players
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </FormContainer>
    </div>
  );
}
