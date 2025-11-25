export interface LeaderboardEntryDto {
  catId: string;
  url: string;
  likes: number;
  rank: number;
  breed_name?: string | null;
}

export interface LeaderboardRow {
  id: string;
  image_url: string | null;
  count: number;
  breed_name?: string | null;
}

export function toLeaderboardDto(rows: LeaderboardRow[]): LeaderboardEntryDto[] {
  return rows.map((row, index) => ({
    catId: row.id,
    url: row.image_url || '',
    likes: row.count,
    rank: index + 1,
    breed_name: row.breed_name,
  }));
}
