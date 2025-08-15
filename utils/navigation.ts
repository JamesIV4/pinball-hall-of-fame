import { safeSetItem } from "./storage";

// Keys used across pages to prefill dropdowns
export const PREFILL_PLAYER_KEY = "phof_prefill_player"; // expects player id
export const PREFILL_MACHINE_KEY = "phof_prefill_machine"; // expects machine name

/**
 * Navigate to Add Score prefilled for a player
 */
export function goToAddScoreForPlayer(playerId: string) {
  if (!playerId) return;
  safeSetItem(PREFILL_PLAYER_KEY, playerId);
  if (typeof window !== "undefined") {
    window.location.hash = "addScore";
  }
}

/**
 * Navigate to Player Stats and preselect the player
 */
export function goToPlayerStatsForPlayer(playerId: string) {
  if (!playerId) return;
  safeSetItem(PREFILL_PLAYER_KEY, playerId);
  if (typeof window !== "undefined") {
    window.location.hash = "playerStats";
  }
}

/**
 * Navigate to High Scores and preselect the machine
 * @param machineName Exact machine display name
 * @param view One of "highScores" (all-time) or "highScoresWeekly"
 */
export function goToHighScoresForMachine(machineName: string, view: "highScores" | "highScoresWeekly" = "highScores") {
  if (!machineName) return;
  safeSetItem(PREFILL_MACHINE_KEY, machineName);
  if (typeof window !== "undefined") {
    window.location.hash = view;
  }
}
