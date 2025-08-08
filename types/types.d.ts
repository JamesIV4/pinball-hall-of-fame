export type View =
  | "home"
  | "manageMachines"
  | "managePlayers"
  | "addScore"
  | "manageScores"
  | "highScores"
  | "highScoresWeekly"
  | "allRecentScores"
  | "scoresByPlayer"
  | "allScores"
  | "manageDatabase";

export interface ScoreEntry {
  score: number;
  timestamp?: string;
}

export interface Machine {
  id: string;
  name: string;
  image?: string;
}

export interface Player {
  id: string;
  name: string;
  scores?: Record<string, ScoreEntry[]>;
}
