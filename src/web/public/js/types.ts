export interface Cat {
  id: string;
  url: string;
  width?: number;
  height?: number;
  likes?: number;
  breeds?: {
    id: string;
    name: string;
    temperament?: string;
    origin?: string;
    description?: string;
    life_span?: string;
    wikipedia_url?: string;
    weight?: { metric: string; imperial: string };
  }[];
}

export interface LeaderboardEntry {
  catId: string;
  url: string;
  likes: number;
  rank: number;
  breed_name?: string;
}

export interface UserProfile {
  id: number;
  telegramId: string;
  username?: string;
  firstName?: string;
  avatarUrl?: string;
}
