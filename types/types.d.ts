export type View =
  | "home"
  | "addMachine"
  | "addPlayer"
  | "addScore"
  | "manageScores"
  | "highScores"
  | "highScoresWeekly"
  | "scoresByPlayer"
  | "allScores";

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