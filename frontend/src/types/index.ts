export interface User {
  _id: string;
  name: string;
  avatar?: string;
  totalPoints: number;
  rank?: number;
}

export interface ClaimHistory {
  _id: string;
  userId: string;
  userName: string;
  pointsAwarded: number;
  timestamp: string;
  totalPointsAfter: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
