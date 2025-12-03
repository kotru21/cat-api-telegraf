import { z } from 'zod';

/**
 * Validation schemas for API routes
 * Using Zod for runtime type checking and validation
 */

// Common patterns
const CAT_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
const MAX_STRING_LENGTH = 100;

// Cat ID schema - alphanumeric with underscores and hyphens
export const catIdSchema = z
  .string()
  .min(1, 'Cat ID is required')
  .max(MAX_STRING_LENGTH, 'Cat ID too long')
  .regex(CAT_ID_PATTERN, 'Invalid cat ID format');

// Like request body schema
export const likeBodySchema = z.object({
  catId: catIdSchema,
});

// Similar cats query parameters
export const similarQuerySchema = z.object({
  feature: z.string().min(1, 'Feature is required').max(50, 'Feature name too long'),
  value: z.string().min(1, 'Value is required').max(MAX_STRING_LENGTH, 'Value too long'),
});

// Random images query parameters
export const randomImagesQuerySchema = z.object({
  count: z
    .string()
    .optional()
    .default('3')
    .transform((val) => {
      const num = parseInt(val, 10);
      return isNaN(num) ? 3 : Math.min(Math.max(num, 1), 10); // Clamp between 1 and 10
    }),
});

// Leaderboard query parameters
export const leaderboardQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .default('10')
    .transform((val) => {
      const num = parseInt(val, 10);
      return isNaN(num) ? 10 : Math.min(Math.max(num, 1), 50); // Clamp between 1 and 50
    }),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => {
      const num = parseInt(val, 10);
      return isNaN(num) || num < 1 ? 1 : num;
    }),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform((val) => {
      const num = parseInt(val, 10);
      return isNaN(num) ? 20 : Math.min(Math.max(num, 1), 100); // Clamp between 1 and 100
    }),
});

// Type exports
export type LikeBody = z.infer<typeof likeBodySchema>;
export type SimilarQuery = z.infer<typeof similarQuerySchema>;
export type RandomImagesQuery = z.infer<typeof randomImagesQuerySchema>;
export type LeaderboardQuery = z.infer<typeof leaderboardQuerySchema>;
export type PaginationQuery = z.infer<typeof paginationSchema>;
