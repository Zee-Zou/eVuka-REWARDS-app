export interface Receipt {
  id: string;
  user_id: string;
  image_url: string;
  total: number;
  store: string;
  points_earned: number;
  created_at: string;
  category: string;
  fraud_score?: number;
}

export interface PointsTransaction {
  id: string;
  user_id: string;
  points: number;
  source: string;
  receipt_id?: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  avatar_url?: string;
  total_points: number;
  level: number;
  achievements: string[];
  totp_secret?: string;
  mfa_enabled?: boolean;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  points_cost: number;
  image_url: string;
  stock: number;
  category: string;
}

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url?: string;
  points: number;
  rank: number;
}

export interface ReceiptAnalysis {
  id: string;
  receipt_id: string;
  items: {
    name: string;
    price: number;
    category?: string;
  }[];
  total: number;
  store: string;
  date: string;
  confidence_score: number;
}
