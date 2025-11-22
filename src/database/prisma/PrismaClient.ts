import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

// Singleton Prisma client
let prisma: PrismaClient;

export function getPrisma(): PrismaClient {
  if (!prisma) {
    // Use new libSQL adapter API (v6.6.0+) - no need to call createClient
    const adapter = new PrismaLibSql({
      url: process.env.DATABASE_URL || 'file:./prisma/main.db',
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    prisma = new PrismaClient({ adapter });
  }
  return prisma;
}

export default getPrisma;
