import { useMemo, useState } from "react";
import { useFirebaseData } from "../hooks/useFirebaseData";
import { Player, ScoreEntry } from "../types/types";
import ListHeader, { TimeFilter } from "./ui/ListHeader";
import RecentEventList, { RecentEventItem } from "./ui/RecentEventList";

export default function AllRecentScores() {
  const { players } = useFirebaseData();
  const [search, setSearch] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");

  const events = useMemo<RecentEventItem[]>(() => {
    const list: RecentEventItem[] = [];
    for (const p of players as Player[]) {
      if (!p.scores) continue;
      for (const [machineName, scores] of Object.entries(p.scores)) {
        for (const entry of scores) {
          list.push({
            playerId: p.id,
            playerName: p.name,
            machineName,
            entry: entry as ScoreEntry,
          });
        }
      }
    }
    return list
      .filter((e) => e.entry.timestamp)
      .sort(
        (a, b) => new Date(b.entry.timestamp!).getTime() - new Date(a.entry.timestamp!).getTime(),
      );
  }, [players]);

  const filtered = useMemo(() => {
    let list = events;
    if (timeFilter !== "all") {
      const now = Date.now();
      const cutoff =
        timeFilter === "24h"
          ? now - 24 * 60 * 60 * 1000
          : timeFilter === "7d"
            ? now - 7 * 24 * 60 * 60 * 1000
            : now - 30 * 24 * 60 * 60 * 1000;
      list = list.filter((e) => (e.entry.timestamp ? new Date(e.entry.timestamp).getTime() >= cutoff : false));
    }

    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (e) =>
        e.playerName.toLowerCase().includes(q) ||
        e.machineName.toLowerCase().includes(q) ||
        e.entry.score.toString().includes(q),
    );
  }, [events, search, timeFilter]);

  return (
    <div className="space-y-4">
      <ListHeader
        title="All Recent Scores"
        count={filtered.length}
        timeFilter={timeFilter}
        onTimeFilterChange={setTimeFilter}
        search={search}
        onSearchChange={setSearch}
        placeholder="Search by player, machine, or score..."
      />

      <RecentEventList items={filtered} showIcon />
    </div>
  );
}
