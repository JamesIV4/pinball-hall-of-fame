export type View =
  | "home"
  | "manageMachines"
  | "managePlayers"
  | "addScore"
  | "manageScores"
  | "highScores"
  | "highScoresWeekly"
  | "allRecentScores"
  | "playerStats"
<<<<<<< HEAD
=======
  | "allScores"
>>>>>>> 036188eccdcf61d46e8e61d6ea509559aeea16e3
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
