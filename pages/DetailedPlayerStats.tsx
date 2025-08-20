import { useEffect, useMemo, useState } from "react";
import { useFirebaseData } from "../hooks/useFirebaseData";
import FormContainer from "@/components/ui/FormContainer";
import Select from "@/components/ui/Select";
import { Machine, Player, ScoreEntry } from "@/types/types";
import { getWeekStart } from "@/utils/weekUtils";

type FlatPlay = {
  machine: string;
  score: number;
  date: Date | null;
};

type MachineAggregate = {
  machine: string;
  plays: number;
  mean: number;
  median: number;
  best: number;
  stddev: number;
  cv: number; // coefficient of variation
  recentAvg?: number;
  previousAvg?: number;
  improvement?: number;
};

function toDate(ts?: string): Date | null {
  if (!ts) return null;
  const d = new Date(ts);
  return isNaN(d.getTime()) ? null : d;
}

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  const w = idx - lo;
  return Math.round(sorted[lo] * (1 - w) + sorted[hi] * w);
}

function medianOf(values: number[]): number {
  if (!values.length) return 0;
  const arr = [...values].sort((a, b) => a - b);
  const mid = Math.floor(arr.length / 2);
  return arr.length % 2 === 0 ? Math.round((arr[mid - 1] + arr[mid]) / 2) : arr[mid];
}

function meanOf(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stddevOf(values: number[], mean?: number): number {
  if (values.length <= 1) return 0;
  const m = mean ?? meanOf(values);
  const v = meanOf(values.map((x) => (x - m) ** 2));
  return Math.sqrt(v);
}

function rollingAverage(arr: number[], window = 3): number[] {
  const out: number[] = [];
  for (let i = 0; i < arr.length; i++) {
    const start = Math.max(0, i - (window - 1));
    const slice = arr.slice(start, i + 1);
    out.push(slice.reduce((a, b) => a + b, 0) / slice.length);
  }
  return out;
}

// deterministic HSL color from string
function colorForKey(key: string, s = 65, l = 55): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, ${s}%, ${l}%)`;
}

function useDerivedPlayer(players: Player[]) {
  const [playerId, setPlayerId] = useState("");
  useEffect(() => {
    if (!playerId && players.length) setPlayerId(players[0].id);
  }, [players, playerId]);
  const player = players.find((p) => p.id === playerId);
  return { playerId, setPlayerId, player };
}

export default function DetailedPlayerStatsPage() {
  const { machines, players } = useFirebaseData();
  const { playerId, setPlayerId, player } = useDerivedPlayer(players);

  const flatPlays: FlatPlay[] = useMemo(() => {
    if (!player?.scores) return [];
    const out: FlatPlay[] = [];
    for (const [machine, list] of Object.entries(player.scores)) {
      for (const s of list) {
        out.push({ machine, score: s.score, date: toDate(s.timestamp) });
      }
    }
    return out.sort((a, b) => {
      const ta = a.date?.getTime() ?? 0;
      const tb = b.date?.getTime() ?? 0;
      return ta - tb;
    });
  }, [player]);

  // Timeframe selector state + filtered plays
  const timeframeOptions = [
    { value: "1w", label: "1 week" },
    { value: "2w", label: "2 weeks" },
    { value: "1m", label: "1 month" },
    { value: "3m", label: "3 months" },
    { value: "6m", label: "6 months" },
    { value: "1y", label: "Past year" },
    { value: "5y", label: "Past 5 years" },
    { value: "10y", label: "Past 10 years" },
    { value: "ALL", label: "All time" },
  ] as const;
  const [timeframe, setTimeframe] = useState<string>("1y");

  const filteredPlays = useMemo(() => {
    if (timeframe === "ALL") return flatPlays;
    const now = new Date();
    const start = new Date(now);
    switch (timeframe) {
      case "1w":
        start.setDate(now.getDate() - 7);
        break;
      case "2w":
        start.setDate(now.getDate() - 14);
        break;
      case "1m":
        start.setMonth(now.getMonth() - 1);
        break;
      case "3m":
        start.setMonth(now.getMonth() - 3);
        break;
      case "6m":
        start.setMonth(now.getMonth() - 6);
        break;
      case "1y":
        start.setFullYear(now.getFullYear() - 1);
        break;
      case "5y":
        start.setFullYear(now.getFullYear() - 5);
        break;
      case "10y":
        start.setFullYear(now.getFullYear() - 10);
        break;
      default:
        return flatPlays;
    }
    start.setHours(0, 0, 0, 0);
    return flatPlays.filter((p) => p.date && p.date >= start);
  }, [flatPlays, timeframe]);

  const totals = useMemo(() => {
    const totalPlays = filteredPlays.length;
    const machinesPlayed = new Set(filteredPlays.map((p) => p.machine)).size;

    const dateSet = new Set(
      filteredPlays
        .filter((p) => p.date)
        .map((p) => dateKey(p.date as Date)),
    );
    const activeDays = dateSet.size;

    const lastPlayed = filteredPlays.reduce<Date | null>((acc, p) => {
      if (!p.date) return acc;
      if (!acc || p.date > acc) return p.date;
      return acc;
    }, null);

    // streaks (by day)
    const sortedDays = Array.from(dateSet)
      .map((k) => new Date(k))
      .sort((a, b) => a.getTime() - b.getTime());
    let bestStreak = 0;
    let currentStreak = 0;
    if (sortedDays.length) {
      // compute max streak
      let streak = 1;
      for (let i = 1; i < sortedDays.length; i++) {
        const prev = sortedDays[i - 1];
        const cur = sortedDays[i];
        const diffDays = Math.round((cur.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) streak += 1;
        else streak = 1;
        bestStreak = Math.max(bestStreak, streak);
      }
      bestStreak = Math.max(bestStreak, 1);

      // current streak up to today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayKey = dateKey(today);
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yesterdayKey = dateKey(yesterday);

      if (dateSet.has(todayKey)) {
        // extend streak backwards from today
        let day = new Date(today);
        let streakCount = 0;
        while (dateSet.has(dateKey(day))) {
          streakCount += 1;
          day.setDate(day.getDate() - 1);
        }
        currentStreak = streakCount;
      } else if (dateSet.has(yesterdayKey)) {
        // extend from yesterday backwards
        let day = new Date(yesterday);
        let streakCount = 0;
        while (dateSet.has(dateKey(day))) {
          streakCount += 1;
          day.setDate(day.getDate() - 1);
        }
        currentStreak = streakCount;
      } else {
        currentStreak = 0;
      }
    }

    const daysSinceLast =
      lastPlayed ? Math.floor((Date.now() - lastPlayed.getTime()) / (1000 * 60 * 60 * 24)) : null;

    return { totalPlays, machinesPlayed, activeDays, lastPlayed, currentStreak, bestStreak, daysSinceLast };
  }, [filteredPlays]);

  // Weekly trend (last 26 weeks)
  const weeklyTrend = useMemo(() => {
    const weeks = 26;
    const now = new Date();
    const currentWeekStart = getWeekStart(now);
    const weekStarts: Date[] = [];
    for (let i = 0; i < weeks; i++) {
      const d = new Date(currentWeekStart);
      d.setDate(d.getDate() - (weeks - 1 - i) * 7);
      weekStarts.push(d);
    }
    const counts = new Array(weeks).fill(0);
    for (const p of filteredPlays) {
      if (!p.date) continue;
      const ws = getWeekStart(p.date);
      const idx = weekStarts.findIndex((w) => w.getTime() === ws.getTime());
      if (idx >= 0) counts[idx] += 1;
    }
    const avg3 = rollingAverage(counts, 3);
    return { weekStarts, counts, avg3 };
  }, [filteredPlays]);

  // Weekday x Hour heatmap
  const heatmap = useMemo(() => {
    // rows: 0=Mon .. 6=Sun to match getWeekStart logic (Mon-based)
    const grid = Array.from({ length: 7 }, () => new Array(24).fill(0));
    for (const p of filteredPlays) {
      if (!p.date) continue;
      let day = p.date.getDay(); // 0 Sun .. 6 Sat
      // convert to 0 Mon .. 6 Sun
      day = day === 0 ? 6 : day - 1;
      const hr = p.date.getHours();
      grid[day][hr] += 1;
    }
    let max = 0;
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 24; c++) max = Math.max(max, grid[r][c]);
    }
    return { grid, max };
  }, [filteredPlays]);

  // Score distribution (all or per-machine)
  const [distMachine, setDistMachine] = useState<string>("ALL");
  const dist = useMemo(() => {
    const values =
      distMachine === "ALL"
        ? filteredPlays.map((p) => p.score)
        : filteredPlays.filter((p) => p.machine === distMachine).map((p) => p.score);
    const filtered = values.filter((v) => Number.isFinite(v));
    if (!filtered.length) return { bins: [] as { x0: number; x1: number; n: number }[], min: 0, max: 0, p50: 0, p90: 0, p99: 0 };
    const sorted = [...filtered].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const binCount = Math.min(12, Math.max(5, Math.ceil(Math.log2(sorted.length) + 1)));
    const width = (max - min) / (binCount || 1) || 1;
    const bins = Array.from({ length: binCount }, (_, i) => ({ x0: min + i * width, x1: min + (i + 1) * width, n: 0 }));
    for (const v of sorted) {
      const idx = v === max ? bins.length - 1 : Math.floor((v - min) / width);
      bins[idx].n += 1;
    }
    const p50 = percentile(sorted, 50);
    const p90 = percentile(sorted, 90);
    const p99 = percentile(sorted, 99);
    return { bins, min, max, p50, p90, p99 };
  }, [filteredPlays, distMachine]);

  // Machine stats
  const machineAggs: MachineAggregate[] = useMemo(() => {
    const out: MachineAggregate[] = [];
    if (!player?.scores) return out;
    for (const [machine, list] of Object.entries(player.scores)) {
      const vals = list.map((s) => s.score).filter((v) => Number.isFinite(v));
      if (!vals.length) continue;
      const mean = meanOf(vals);
      const med = medianOf(vals);
      const sd = stddevOf(vals, mean);
      const cv = mean ? sd / mean : 0;

      const sortedByDate = [...list]
        .map((s) => ({ score: s.score, date: toDate(s.timestamp) }))
        .sort((a, b) => (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0));
      const last10 = sortedByDate.slice(-10).map((x) => x.score);
      const prev10 = sortedByDate.slice(-20, -10).map((x) => x.score);
      const recentAvg = last10.length ? meanOf(last10) : undefined;
      const previousAvg = prev10.length ? meanOf(prev10) : undefined;
      const improvement =
        recentAvg !== undefined && previousAvg !== undefined ? recentAvg - previousAvg : undefined;

      out.push({
        machine,
        plays: vals.length,
        mean,
        median: med,
        best: Math.max(...vals),
        stddev: sd,
        cv,
        recentAvg,
        previousAvg,
        improvement,
      });
    }
    return out.sort((a, b) => b.plays - a.plays);
  }, [player]);

  // Competitive: share of top-3 across machines + head-to-head win rate vs field (best score basis)
  const competitive = useMemo(() => {
    if (!players.length) return { top3Count: 0, machineCount: 0, share: 0, headToHeadOverall: 0, perMachine: [] as { machine: string; winRate: number; rank: number | null; fieldSize: number }[] };
    const machinesSet = new Set<string>();
    for (const p of players) {
      for (const m of Object.keys(p.scores || {})) machinesSet.add(m);
    }
    let top3Count = 0;
    const perMachine: { machine: string; winRate: number; rank: number | null; fieldSize: number }[] = [];

    for (const m of machinesSet) {
      // best per player
      const bests = players
        .map((pl) => {
          const list = (pl.scores?.[m] || []).map((s) => s.score);
          const best = list.length ? Math.max(...list) : 0;
          return { id: pl.id, best };
        })
        .filter((x) => x.best > 0)
        .sort((a, b) => b.best - a.best);

      const fieldSize = bests.length;
      if (!fieldSize) continue;

      const rank = bests.findIndex((x) => x.id === playerId);
      if (rank >= 0 && rank < 3) top3Count += 1;

      // head-to-head: how many players does this player beat or tie
      const myBest = bests.find((x) => x.id === playerId)?.best ?? 0;
      const wins = bests.filter((x) => x.id !== playerId && myBest >= x.best).length;
      const opponents = Math.max(1, fieldSize - 1);
      const winRate = opponents ? wins / opponents : 0;

      perMachine.push({ machine: m, winRate, rank: rank >= 0 ? rank + 1 : null, fieldSize });
    }

    const machineCount = machinesSet.size;
    const share = machineCount ? top3Count / machineCount : 0;

    // overall head-to-head = average of per-machine
    const headToHeadOverall =
      perMachine.length ? perMachine.reduce((a, b) => a + b.winRate, 0) / perMachine.length : 0;

    // sort per-machine by win rate desc
    perMachine.sort((a, b) => b.winRate - a.winRate);

    return { top3Count, machineCount, share, headToHeadOverall, perMachine };
  }, [players, playerId]);

  // Recent 30 plays scatter
  const recentPlays = useMemo(() => {
    const withDate = filteredPlays.filter((p) => p.date);
    const last30 = withDate.slice(-30);
    const xs = last30.map((p) => p.date!.getTime());
    const ys = last30.map((p) => p.score);
    const xMin = Math.min(...xs, Date.now());
    const xMax = Math.max(...xs, Date.now());
    const yMin = Math.min(...ys, 0);
    const yMax = Math.max(...ys, 1);

    // linear regression (least squares)
    let slope = 0;
    let intercept = 0;
    if (xs.length >= 2) {
      const xMean = meanOf(xs);
      const yMean = meanOf(ys);
      const num = xs.reduce((acc, x, i) => acc + (x - xMean) * (ys[i] - yMean), 0);
      const den = xs.reduce((acc, x) => acc + (x - xMean) * (x - xMean), 0);
      if (den !== 0) {
        slope = num / den;
        intercept = yMean - slope * xMean;
      }
    }

    return { data: last30, xMin, xMax, yMin, yMax, slope, intercept };
  }, [filteredPlays]);

  const machineOptions = useMemo(() => {
    const names = new Set(filteredPlays.map((p) => p.machine));
    return ["ALL", ...Array.from(names).sort()];
  }, [filteredPlays]);

  // Recent scores for selected machine (within selected timeframe)
  const recentScores = useMemo(() => {
    if (distMachine === "ALL")
      return { machine: distMachine, points: [] as { score: number; date: Date | null }[], max: 0 };

    // collect plays from the current timeframe for the selected machine
    const pts = filteredPlays
      .filter((p) => p.machine === distMachine && p.date)
      .map((p) => ({ score: p.score, date: p.date as Date }));

    if (!pts.length) return { machine: distMachine, points: [] as { score: number; date: Date | null }[], max: 0 };

    // sort ascending by date and include ALL points within the selected timeframe
    pts.sort((a, b) => a.date!.getTime() - b.date!.getTime());
    const max = Math.max(...pts.map((x) => x.score), 1);
    return { machine: distMachine, points: pts, max };
  }, [filteredPlays, distMachine]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-950 to-black">
      <div className="mx-auto max-w-7xl p-4 md:p-6">
        <header className="mb-6 md:mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-wide text-amber-400">
            Detailed Player Stats
          </h1>
          <p className="text-gray-400 mt-2">Dive deep into your pinball performance analytics</p>
        </header>

        <FormContainer title="Analyze a Player">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
            <div className="w-full md:w-80">
              <Select
                value={playerId}
                onChange={(e) => setPlayerId(e.target.value)}
                options={players.map((p) => ({ value: p.id, label: p.name }))}
                placeholder="-- select player --"
              />
            </div>

            <div className="w-full md:w-44">
              <Select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                options={timeframeOptions.map((t) => ({ value: t.value, label: t.label }))}
                placeholder="Timeframe"
              />
            </div>

            <div className="flex-1"></div>

            <div className="w-full md:w-64">
              <Select
                value={distMachine}
                onChange={(e) => setDistMachine(e.target.value)}
                options={machineOptions.map((m) => ({ value: m, label: m === "ALL" ? "All Machines" : m }))}
                placeholder="Distribution scope"
              />
            </div>
          </div>
        </FormContainer>

        {!player ? (
          <p className="text-gray-400">No player selected.</p>
        ) : flatPlays.length === 0 ? (
          <p className="text-gray-400">No scores recorded for {player.name} yet.</p>
        ) : (
          <div className="space-y-6">
            {/* Recent scores bar */}
            <section className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
              <h2 className="text-lg font-semibold text-amber-300 mb-3">
                Recent Scores {distMachine !== "ALL" ? `(${distMachine})` : ""}
              </h2>
              {distMachine === "ALL" ? (
                <p className="text-gray-400">Select a machine to view recent scores.</p>
              ) : recentScores.points.length ? (
                <RecentScoresBar data={recentScores} />
              ) : (
                <p className="text-gray-400">No recent scores for {distMachine}.</p>
              )}
            </section>

            {/* Summary tiles */}
            <section className="grid md:grid-cols-3 lg:grid-cols-6 gap-3">
              <SummaryTile label="Total Plays" value={totals.totalPlays.toLocaleString()} accent="amber" />
              <SummaryTile label="Machines" value={totals.machinesPlayed.toString()} accent="blue" />
              <SummaryTile label="Active Days" value={totals.activeDays.toString()} accent="green" />
              <SummaryTile
                label="Last Played"
                value={totals.lastPlayed ? totals.lastPlayed.toLocaleDateString() : "—"}
                accent="indigo"
              />
              <SummaryTile label="Current Streak" value={`${totals.currentStreak}d`} accent="pink" />
              <SummaryTile label="Best Streak" value={`${totals.bestStreak}d`} accent="violet" />
            </section>

            {/* Trends */}
            <section className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
              <h2 className="text-lg font-semibold text-amber-300 mb-3">Weekly Activity (26 weeks)</h2>
              <div className="w-full overflow-x-auto">
                <TrendChart weeks={weeklyTrend.weekStarts} counts={weeklyTrend.counts} avg={weeklyTrend.avg3} />
              </div>
              <div className="mt-3 text-sm text-gray-400">
                Avg last 4 weeks:{" "}
                <span className="text-gray-200 font-semibold">
                  {Math.round((weeklyTrend.counts.slice(-4).reduce((a, b) => a + b, 0) / Math.max(1, Math.min(4, weeklyTrend.counts.slice(-4).length))) * 10) / 10}
                </span>
              </div>
            </section>

            {/* Heatmap */}
            <section className="grid lg:grid-cols-2 gap-4">
              <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
                <h2 className="text-lg font-semibold text-amber-300 mb-3">Plays Heatmap (Weekday x Hour)</h2>
                <Heatmap grid={heatmap.grid} max={heatmap.max} />
                <p className="text-xs text-gray-500 mt-2">Darker cells indicate more plays.</p>
              </div>

              {/* Distribution */}
              <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
                <h2 className="text-lg font-semibold text-amber-300 mb-3">Score Distribution ({distMachine === "ALL" ? "All" : distMachine})</h2>
                {dist.bins.length ? (
                  <Histogram bins={dist.bins} />
                ) : (
                  <p className="text-gray-400">No data for selected scope.</p>
                )}
                <div className="mt-3 text-sm text-gray-300 flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-2">
                    <span className="text-gray-400">P50</span>
                    <span className="px-2 py-0.5 bg-amber-500 text-black rounded text-xs font-semibold">
                      {dist.p50.toLocaleString()}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="text-gray-400">P90</span>
                    <span className="px-2 py-0.5 bg-blue-500 text-white rounded text-xs font-semibold">
                      {dist.p90.toLocaleString()}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="text-gray-400">P99</span>
                    <span className="px-2 py-0.5 bg-green-500 text-white rounded text-xs font-semibold">
                      {dist.p99.toLocaleString()}
                    </span>
                  </span>
                </div>
              </div>
            </section>

            {/* Machine insights */}
            <section className="grid xl:grid-cols-3 gap-4">
              <InsightList
                title="Most Improved (last 10 vs prev 10)"
                items={[...machineAggs]
                  .filter((m) => m.improvement !== undefined)
                  .sort((a, b) => (b.improvement || 0) - (a.improvement || 0))
                  .slice(0, 8)
                  .map((m) => ({
                    label: m.machine,
                    value:
                      m.improvement !== undefined
                        ? `${Math.round(m.improvement).toLocaleString()}`
                        : "—",
                    sub: `recent: ${Math.round(m.recentAvg || 0).toLocaleString()} prev: ${Math.round(m.previousAvg || 0).toLocaleString()}`,
                    color: "green",
                  }))}
              />

              <InsightList
                title="Toughest Machines (lowest median)"
                items={[...machineAggs]
                  .sort((a, b) => a.median - b.median)
                  .slice(0, 8)
                  .map((m) => ({
                    label: m.machine,
                    value: m.median.toLocaleString(),
                    sub: `${m.plays} plays`,
                    color: "red",
                  }))}
              />

              <InsightList
                title="Most Consistent (lowest CV)"
                items={[...machineAggs]
                  .filter((m) => m.plays >= 5)
                  .sort((a, b) => a.cv - b.cv)
                  .slice(0, 8)
                  .map((m) => ({
                    label: m.machine,
                    value: (m.cv * 100).toFixed(1) + "%", // CV as %
                    sub: `${m.plays} plays | μ ${Math.round(m.mean).toLocaleString()}`,
                    color: "blue",
                  }))}
              />
            </section>

            {/* Competitive context */}
            <section className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <h2 className="text-lg font-semibold text-amber-300">Competitive Context</h2>
                <div className="flex gap-2 text-sm">
                  <span className="px-2 py-1 rounded bg-gray-800 border border-gray-700 text-gray-200">
                    Top-3 across machines:{" "}
                    <span className="text-amber-300 font-semibold">
                      {competitive.top3Count}/{competitive.machineCount}
                    </span>
                  </span>
                  <span className="px-2 py-1 rounded bg-gray-800 border border-gray-700 text-gray-200">
                    Share: <span className="text-blue-300 font-semibold">
                      {(competitive.share * 100).toFixed(1)}%
                    </span>
                  </span>
                  <span className="px-2 py-1 rounded bg-gray-800 border border-gray-700 text-gray-200">
                    H2H overall: <span className="text-green-300 font-semibold">
                      {(competitive.headToHeadOverall * 100).toFixed(1)}%
                    </span>
                  </span>
                </div>
              </div>

              <div className="mt-4 grid md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-gray-800 bg-gray-950/50 p-3">
                  <h3 className="text-sm text-gray-300 mb-2">Best H2H Machines</h3>
                  <ul className="space-y-2 text-sm">
                    {competitive.perMachine.slice(0, 8).map((m) => (
                      <li key={m.machine} className="flex items-center justify-between">
                        <span className="truncate text-gray-200">{m.machine}</span>
                        <span className="text-green-300">{(m.winRate * 100).toFixed(0)}%</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-lg border border-gray-800 bg-gray-950/50 p-3">
                  <h3 className="text-sm text-gray-300 mb-2">Challenging H2H Machines</h3>
                  <ul className="space-y-2 text-sm">
                    {[...competitive.perMachine]
                      .reverse()
                      .slice(0, 8)
                      .map((m) => (
                        <li key={m.machine} className="flex items-center justify-between">
                          <span className="truncate text-gray-200">{m.machine}</span>
                          <span className="text-red-300">{(m.winRate * 100).toFixed(0)}%</span>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Per-machine table */}
            <section className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 overflow-x-auto">
              <h2 className="text-lg font-semibold text-amber-300 mb-3">Per-Machine Metrics</h2>
              <table className="min-w-[720px] w-full text-sm">
                <thead className="text-gray-300">
                  <tr className="text-left">
                    <th className="py-2 pr-3">Machine</th>
                    <th className="py-2 pr-3">Plays</th>
                    <th className="py-2 pr-3">Median</th>
                    <th className="py-2 pr-3">Mean</th>
                    <th className="py-2 pr-3">Best</th>
                    <th className="py-2 pr-3">CV</th>
                    <th className="py-2 pr-3">Recent Avg</th>
                    <th className="py-2 pr-3">Improvement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 text-gray-200">
                  {machineAggs.map((m) => (
                    <tr key={m.machine}>
                      <td className="py-2 pr-3">{m.machine}</td>
                      <td className="py-2 pr-3 text-gray-300">{m.plays}</td>
                      <td className="py-2 pr-3">{Math.round(m.median).toLocaleString()}</td>
                      <td className="py-2 pr-3 text-gray-300">{Math.round(m.mean).toLocaleString()}</td>
                      <td className="py-2 pr-3">{m.best.toLocaleString()}</td>
                      <td className="py-2 pr-3">{(m.cv * 100).toFixed(1)}%</td>
                      <td className="py-2 pr-3">{m.recentAvg !== undefined ? Math.round(m.recentAvg).toLocaleString() : "—"}</td>
                      <td className="py-2 pr-3">
                        {m.improvement !== undefined ? (
                          <span className={m.improvement >= 0 ? "text-green-400" : "text-red-400"}>
                            {Math.round(m.improvement).toLocaleString()}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* Recent plays scatter */}
            <section className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
              <h2 className="text-lg font-semibold text-amber-300 mb-3">Recent Plays (last 30)</h2>
              <ScatterPlot data={recentPlays} />
              <p className="text-xs text-gray-500 mt-2">Points colored by machine. Line shows trend.</p>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- UI Bits ---------- */

function SummaryTile(props: { label: string; value: string; accent?: "amber" | "blue" | "green" | "indigo" | "pink" | "violet" }) {
  const { label, value, accent = "amber" } = props;
  const colors: Record<NonNullable<typeof accent>, string> = {
    amber: "from-amber-500/10 border-amber-500/30",
    blue: "from-blue-500/10 border-blue-500/30",
    green: "from-green-500/10 border-green-500/30",
    indigo: "from-indigo-500/10 border-indigo-500/30",
    pink: "from-pink-500/10 border-pink-500/30",
    violet: "from-violet-500/10 border-violet-500/30",
  };
  return (
    <div className={`rounded-lg border ${colors[accent]} bg-gradient-to-br to-gray-900 p-3`}>
      <div className="text-xs text-gray-400">{label}</div>
      <div className="text-2xl font-bold text-amber-300">{value}</div>
    </div>
  );
}

function TrendChart({ weeks, counts, avg }: { weeks: Date[]; counts: number[]; avg: number[] }) {
  const w = Math.max(400, weeks.length * 24);
  const h = 180;
  const max = Math.max(...counts, 1);
  const pad = 24;

  const linePoints = counts
    .map((v, i) => {
      const x = pad + (i / Math.max(1, counts.length - 1)) * (w - 2 * pad);
      const y = h - pad - (v / max) * (h - 2 * pad);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  const avgPoints = avg
    .map((v, i) => {
      const x = pad + (i / Math.max(1, avg.length - 1)) * (w - 2 * pad);
      const y = h - pad - (v / max) * (h - 2 * pad);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  const xTicks = weeks.map((d, i) => {
    const x = pad + (i / Math.max(1, weeks.length - 1)) * (w - 2 * pad);
    return { x, label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) };
  });

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-48 min-w-[400px]">
      <rect x="0" y="0" width={w} height={h} fill="url(#bg-grad)" />
      <defs>
        <linearGradient id="bg-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(17,24,39,0.6)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.2)" />
        </linearGradient>
      </defs>
      {/* grid */}
      {Array.from({ length: 4 }, (_, i) => {
        const y = pad + (i / 3) * (h - 2 * pad);
        return <line key={i} x1={pad} y1={y} x2={w - pad} y2={y} stroke="#1f2937" strokeWidth="1" />;
      })}
      {/* axis */}
      <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#374151" />
      {/* counts */}
      <polyline fill="none" stroke="#f6c84c" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" points={linePoints} />
      {/* avg */}
      <polyline fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" points={avgPoints} />
      {/* ticks */}
      {xTicks.map((t, i) => (
        <g key={i}>
          <line x1={t.x} x2={t.x} y1={h - pad} y2={h - pad + 4} stroke="#6b7280" />
          {i % 4 === 0 && (
            <text x={t.x} y={h - 4} fill="#9ca3af" fontSize="10" textAnchor="middle">
              {t.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

function Heatmap({ grid, max }: { grid: number[][]; max: number }) {
  const cell = 18;
  const pad = 24;
  const rows = 7;
  const cols = 24;
  const w = pad + cols * cell + pad + 60;
  const h = pad + rows * cell + pad;
  const weekday = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  function cellColor(v: number) {
    if (max <= 0) return "rgba(55,65,81,0.5)";
    const t = v / max;
    const hue = 45; // amber
    const sat = 70;
    const light = clamp(18 + (1 - t) * 50, 18, 68);
    return `hsl(${hue}, ${sat}%, ${light}%)`;
  }

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-48">
      {/* y labels */}
      {weekday.map((d, r) => (
        <text key={d} x={8} y={pad + r * cell + cell * 0.7} fill="#9ca3af" fontSize="10">
          {d}
        </text>
      ))}
      {/* grid */}
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => {
          const x = pad + c * cell;
          const y = pad + r * cell;
          const v = grid[r]?.[c] ?? 0;
          return (
            <rect
              key={`${r}-${c}`}
              x={x}
              y={y}
              width={cell - 2}
              height={cell - 2}
              fill={cellColor(v)}
              stroke="rgba(31,41,55,0.8)"
              strokeWidth="1"
              rx="3"
              ry="3"
            />
          );
        }),
      )}
      {/* x ticks */}
      {Array.from({ length: cols }).map((_, c) => {
        if (c % 3 !== 0) return null;
        const x = pad + c * cell + (cell - 2) / 2;
        return (
          <text key={c} x={x} y={h - 6} fill="#9ca3af" fontSize="10" textAnchor="middle">
            {c}
          </text>
        );
      })}
    </svg>
  );
}

function RecentScoresBar({
  data,
}: {
  data: { machine: string; points: { score: number; date: Date | null }[]; max: number };
}) {
  const n = data.points.length;
  const desiredFitW = 800;
  const pad = 36;
  const minBarW = 3;
  const maxBarW = 24;
  const barWFit = n ? (desiredFitW - 2 * pad) / n : 0;
  const barW = n ? clamp(barWFit, minBarW, maxBarW) : 0;
  const w = Math.max(360, Math.round(2 * pad + barW * n));
  const h = 200;

  const maxY = Math.max(...data.points.map((p) => p.score), 1);
  const yscale = (v: number) => {
    if (maxY === 0) return h - pad;
    return h - pad - (v / maxY) * (h - 2 * pad);
  };

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-56" style={{ width: w }}>
        <rect x="0" y="0" width={w} height={h} fill="rgba(0,0,0,0.1)" />
        {/* axes */}
        <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#374151" />
        <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="#374151" />
        {/* horizontal grid + y labels */}
        {Array.from({ length: 4 }).map((_, i) => {
          const t = i / 3;
          const yVal = t * maxY;
          const y = yscale(yVal);
          return (
            <g key={i}>
              <line x1={pad} y1={y} x2={w - pad} y2={y} stroke="#1f2937" />
              <text x={pad - 6} y={y + 3} fill="#9ca3af" fontSize="10" textAnchor="end">
                {Math.round(yVal).toLocaleString()}
              </text>
            </g>
          );
        })}
        {/* bars */}
        {data.points.map((p, i) => {
          const x = pad + i * barW + 2;
          const bh = Math.max(1, Math.round((p.score / maxY) * (h - 2 * pad)));
          const y = h - pad - bh;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barW - 4}
              height={bh}
              fill="#f6c84c"
              opacity="0.9"
              rx="3"
              ry="3"
            >
              <title>
                {p.score.toLocaleString()} • {p.date ? p.date.toLocaleString() : ""}
              </title>
            </rect>
          );
        })}
        {/* x ticks */}
        {data.points.map((p, i) => {
          if (i % Math.ceil(Math.max(1, n) / 6) !== 0) return null;
          const x = pad + i * barW + barW / 2;
          return (
            <text key={i} x={x} y={h - 8} fill="#9ca3af" fontSize="10" textAnchor="middle">
              {p.date ? p.date.toLocaleDateString(undefined, { month: "short", day: "numeric" }) : ""}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function Histogram({ bins }: { bins: { x0: number; x1: number; n: number }[] }) {
  const w = Math.max(360, bins.length * 24 + 64);
  const h = 180;
  const pad = 32;
  const maxN = Math.max(...bins.map((b) => b.n), 1);
  const barW = (w - 2 * pad) / bins.length;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-48 min-w-[360px]">
      <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#374151" />
      {bins.map((b, i) => {
        const x = pad + i * barW + 2;
        const bh = ((b.n / maxN) * (h - 2 * pad)) | 0;
        const y = h - pad - bh;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barW - 4}
            height={bh}
            fill="#f6c84c"
            opacity="0.9"
            rx="3"
            ry="3"
          />
        );
      })}
      {bins.map((b, i) => {
        if (i % Math.ceil(bins.length / 6) !== 0) return null;
        const x = pad + i * barW + barW / 2;
        return (
          <text key={i} x={x} y={h - 8} fill="#9ca3af" fontSize="10" textAnchor="middle">
            {Math.round(b.x1).toLocaleString()}
          </text>
        );
      })}
    </svg>
  );
}

function InsightList({
  title,
  items,
}: {
  title: string;
  items: { label: string; value: string; sub?: string; color?: "green" | "red" | "blue" }[];
}) {
  const badgeColor = (c?: string) =>
    c === "green" ? "bg-green-500 text-black" : c === "red" ? "bg-red-500 text-black" : "bg-blue-500 text-white";
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
      <h3 className="text-md font-semibold text-gray-200 mb-2">{title}</h3>
      <ul className="space-y-2">
        {items.length ? (
          items.map((it) => (
            <li key={it.label} className="flex items-center justify-between gap-3">
              <span className="truncate text-gray-300">{it.label}</span>
              <div className="flex items-center gap-2">
                {it.sub && <span className="hidden md:inline text-xs text-gray-500">{it.sub}</span>}
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${badgeColor(it.color)}`}>{it.value}</span>
              </div>
            </li>
          ))
        ) : (
          <li className="text-gray-500 text-sm">No data</li>
        )}
      </ul>
    </div>
  );
}

function ScatterPlot({
  data,
}: {
  data: {
    data: FlatPlay[];
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
    slope: number;
    intercept: number;
  };
}) {
  const w = 800;
  const h = 220;
  const pad = 36;
  const xscale = (x: number) => {
    if (data.xMax === data.xMin) return pad;
    return pad + ((x - data.xMin) / (data.xMax - data.xMin)) * (w - 2 * pad);
  };
  const yscale = (y: number) => {
    if (data.yMax === data.yMin) return h - pad;
    return h - pad - ((y - data.yMin) / (data.yMax - data.yMin)) * (h - 2 * pad);
  };

  // trend line endpoints
  const y1 = data.slope * data.xMin + data.intercept;
  const y2 = data.slope * data.xMax + data.intercept;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-56 min-w-[640px]">
        <rect x="0" y="0" width={w} height={h} fill="rgba(0,0,0,0.1)" />
        {/* axes */}
        <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#374151" />
        <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="#374151" />

        {/* trend */}
        <line
          x1={xscale(data.xMin)}
          y1={yscale(y1)}
          x2={xscale(data.xMax)}
          y2={yscale(y2)}
          stroke="#60a5fa"
          strokeWidth="2"
          strokeDasharray="4 3"
        />

        {/* points */}
        {data.data.map((p, i) => (
          <circle
            key={i}
            cx={xscale(p.date!.getTime())}
            cy={yscale(p.score)}
            r="4"
            fill={colorForKey(p.machine)}
            fillOpacity="0.85"
            stroke="#111827"
            strokeWidth="1"
          >
            <title>
              {p.machine} • {p.score.toLocaleString()} • {p.date?.toLocaleString()}
            </title>
          </circle>
        ))}

        {/* x ticks (5) */}
        {Array.from({ length: 5 }).map((_, i) => {
          const t = i / 4;
          const xVal = data.xMin + t * (data.xMax - data.xMin);
          const x = xscale(xVal);
          return (
            <g key={i}>
              <line x1={x} y1={h - pad} x2={x} y2={h - pad + 4} stroke="#6b7280" />
              <text x={x} y={h - 6} fill="#9ca3af" fontSize="10" textAnchor="middle">
                {new Date(xVal).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </text>
            </g>
          );
        })}

        {/* y ticks (4) */}
        {Array.from({ length: 4 }).map((_, i) => {
          const t = i / 3;
          const yVal = data.yMin + t * (data.yMax - data.yMin);
          const y = yscale(yVal);
          return (
            <g key={i}>
              <line x1={pad - 4} y1={y} x2={pad} y2={y} stroke="#6b7280" />
              <text x={pad - 6} y={y + 3} fill="#9ca3af" fontSize="10" textAnchor="end">
                {Math.round(yVal).toLocaleString()}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
