import type { user_likes as UserLike, Cat } from '@prisma/client';
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- imported for type documentation
type _UserLike = UserLike;
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- imported for type documentation
type _Cat = Cat;

export interface UserLikeDTO {
  cat_id: string;
  id?: string;
  breed_name?: string | null;
  image_url?: string | null;
  likes_count: number;
  created_at?: Date;
}

export interface LikesRepositoryInterface {
  getLikes(catId: string): Promise<number>;
  addLike(catId: string, userId: string): Promise<boolean>;
  removeLike(catId: string, userId: string): Promise<boolean>;
  getUserLikes(userId: string): Promise<UserLikeDTO[]>;
  getUserLikesCount(userId: string): Promise<number>;
}
