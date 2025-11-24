import { PrismaClient } from '@prisma/client';

// Singleton Prisma client
let prisma: PrismaClient | undefined;

export function getPrisma(): PrismaClient {
  if (!prisma) {
    try {
      // MongoDB connections in Prisma 7 don't require adapters when using engineType = "library"
      // The DATABASE_URL is read from the environment automatically via schema.prisma config
      prisma = new PrismaClient();
    } catch (err) {
      // Make the failure visible in logs — initialization errors here
      // are fatal for app startup so rethrow afterwards.
      // Avoid importing the project's logger here to keep this module
      // small and dependency-clean during startup.
      // eslint-disable-next-line no-console
      console.error('Failed to initialize Prisma client:', err);
      throw err;
    }
  }

  return prisma;
}

export default getPrisma;
