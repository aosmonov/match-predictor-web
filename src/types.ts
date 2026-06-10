import type { Timestamp } from "firebase/firestore";

export type LocaleKey = "en" | "ru" | "ky";
export type TabKey = "home" | "predictions" | "leaderboard" | "profile";
export type MatchStatus =
  | "LIVE"
  | "UPCOMING"
  | "COMPLETED"
  | "POSTPONED"
  | "SUSPENDED"
  | "CANCELED"
  | "UNKNOWN";
export type KnockoutWinner = "home" | "away";

export interface Match {
  id: string;
  sourceId?: string;
  group?: string | null;
  stage?: string | null;
  isKnockout?: boolean;
  homeTeam?: string | null;
  homeFlag?: string | null;
  awayTeam?: string | null;
  awayFlag?: string | null;
  status: MatchStatus;
  timeOrMin?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
  homePenaltyScore?: number | null;
  awayPenaltyScore?: number | null;
  winner?: KnockoutWinner | null;
  date?: string | Timestamp | Date | null;
  timestamp?: Timestamp | Date | null;
}

export interface Prediction {
  id: string;
  uid: string;
  matchId: string | number;
  homeScore: number;
  awayScore: number;
  penaltyWinner?: KnockoutWinner | null;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface StandingTeam {
  rank: number;
  team: string;
  flag?: string | null;
  mp: number;
  pts: number;
  gf?: number;
  ga?: number;
  gd?: number;
}

export interface LeaderboardEntry {
  id: string;
  uid?: string;
  displayName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  totalPoints?: number;
  rank?: number;
  scoredPredictionCount?: number;
  exactCount?: number;
  goalDifferenceCount?: number;
  outcomeCount?: number;
  penaltyWinnerCount?: number;
}

export interface HistoryItem {
  id: string;
  uid: string;
  match: string;
  prediction: string;
  actualScore: string;
  pointsEarned: number;
  resultType: "Exact Score" | "Goal Diff" | "Outcome" | "Missed";
  breakdown?: {
    outcomePoints?: number;
    goalDifferencePoints?: number;
    exactScorePoints?: number;
    penaltyWinnerPoints?: number;
  };
  kickoffAt?: Timestamp | Date | string | null;
}
