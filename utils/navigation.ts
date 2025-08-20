import { safeSetItem } from "./storage";

// Keys used across pages to prefill dropdowns
export const PREFILL_PLAYER_KEY = "phof_prefill_player"; // expects player id
export const PREFILL_MACHINE_KEY = "phof_prefill_machine"; // expects machine name
export const COMPARE_PLAYER1_KEY = "phof_compare_player1"; // expects player id

/**
 * Push a hash-based navigation entry and notify SPA listeners.
 * Falls back to setting location.hash when pushState is unavailable.
 */
export function navigateToHash(view: string, state?: any) {
  if (typeof window === "undefined") return;
  try {
    window.history.pushState(state ?? null, "", `#${view}`);
    try {
      // Some environments may not support constructing PopStateEvent
      window.dispatchEvent(new PopStateEvent("popstate", state !== undefined ? { state } : undefined as any));
    } catch {}
  } catch {
    window.location.hash = view;
  }
}

/**
 * Navigate to Add Score prefilled for a player
 */
export function goToAddScoreForPlayer(playerId: string) {
  if (!playerId) return;
  safeSetItem(PREFILL_PLAYER_KEY, playerId);
  navigateToHash("addScore");
}

/**
 * Navigate to Player Stats and preselect the player
 */
export function goToPlayerStatsForPlayer(playerId: string) {
  if (!playerId) return;
  safeSetItem(PREFILL_PLAYER_KEY, playerId);
  navigateToHash("playerStats");
}

/**
 * Navigate to Compare Players, preselecting the first player
 */
export function goToComparePlayersWithPlayer(playerId: string) {
  if (!playerId) return;
  safeSetItem(COMPARE_PLAYER1_KEY, playerId);
  navigateToHash("comparePlayers");
}

/**
 * Navigate to High Scores and preselect the machine
 * @param machineName Exact machine display name
 * @param view One of "highScores" (all-time) or "highScoresWeekly"
 */
export function goToHighScoresForMachine(machineName: string, view: "highScores" | "highScoresWeekly" = "highScores") {
  if (!machineName) return;
  safeSetItem(PREFILL_MACHINE_KEY, machineName);
  navigateToHash(view, { prefillMachine: machineName });
}
