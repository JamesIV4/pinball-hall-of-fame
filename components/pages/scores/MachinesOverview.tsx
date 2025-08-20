import FormContainer from "@/components/ui/FormContainer";
import Timestamp from "@/components/ui/Timestamp";
import { useFirebaseData } from "@/hooks/useFirebaseData";
import { goToHighScoresForMachine } from "@/utils/navigation";
import { useMemo } from "react";

export default function MachinesOverview() {
  const { machines, players } = useFirebaseData();

  const machineStats = useMemo(() => {
    const stats = new Map<string, { plays: number; players: number; lastPlayed: string | null }>();
    // Initialize with zeros for all known machines
    for (const m of machines) stats.set(m.name, { plays: 0, players: 0, lastPlayed: null });

    // Count plays, unique players, and last played timestamp per machine
    for (const p of players) {
      const contributed = new Set<string>();
      const scores = p.scores || {};
      for (const [mName, list] of Object.entries(scores)) {
        if (!stats.has(mName)) continue; // ignore unknown machine keys
        const s = stats.get(mName)!;
        s.plays += list.length;
        if (!contributed.has(mName)) {
          s.players += 1;
          contributed.add(mName);
        }
        for (const entry of list) {
          if (!entry.timestamp) continue;
          if (!s.lastPlayed || new Date(entry.timestamp) > new Date(s.lastPlayed)) {
            s.lastPlayed = entry.timestamp;
          }
        }
      }
    }
    return stats;
  }, [machines, players]);

  return (
    <FormContainer title="Machines">
      {machines.length === 0 ? (
        <p className="text-gray-400">No machines yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {machines.map((m) => (
            <button
              key={m.id}
              onClick={() => goToHighScoresForMachine(m.name)}
              className="group relative overflow-hidden rounded-xl border border-gray-700 bg-gray-800/60 hover:border-amber-500/60 shadow-sm hover:shadow-md transition"
              title={`View high scores for ${m.name}`}
            >
              {/* Image */}
              {m.image ? (
                <div className="relative h-40 w-full bg-gray-900">
                  <img
                    src={m.image}
                    alt={m.name}
                    className="h-full w-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  {/* Name overlay on image */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between">
                    <div className="text-lg font-bold text-amber-300 drop-shadow-sm truncate">{m.name}</div>
                  </div>
                </div>
              ) : (
                <div className="h-40 w-full bg-gray-900 flex items-center justify-center text-gray-500">No image</div>
              )}

              {/* Bottom bar with metrics */}
              <div className="px-4 pt-2 pb-3 bg-gray-900/70 border-t border-gray-700/60">
                <div className="h-5 flex items-center justify-center text-center text-xs text-gray-400">Click to view high scores</div>
                <div className="mt-2 h-px bg-gray-700/60" />
                {(() => {
                  const s = machineStats.get(m.name);
                  if (!s) return null;
                  return (
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-300">
                      <div className="inline-flex items-center gap-1">
                        <span className="text-gray-400">Plays:</span>
                        <span className="font-semibold text-amber-300">{s.plays}</span>
                      </div>
                      <div className="inline-flex items-center gap-1">
                        <span className="text-gray-400">Players:</span>
                        <span className="font-semibold text-blue-300">{s.players}</span>
                      </div>
                      <div className="inline-flex items-center gap-1 truncate">
                        <span className="text-gray-400">Last:</span>
                        <span className="text-gray-200">
                          {s.lastPlayed ? <Timestamp as="span" variant="date" timestamp={s.lastPlayed} /> : "—"}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </button>
          ))}
        </div>
      )}
    </FormContainer>
  );
}
