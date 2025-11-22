import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

// Singleton Prisma client
let prisma: PrismaClient;

export function getPrisma(): PrismaClient {
  if (!prisma) {
    const libsql = createClient({
      url: process.env.DATABASE_URL || "file:./dev.db",
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    const adapter = new PrismaLibSql(libsql as any);
    prisma = new PrismaClient({ adapter });
  }
  return prisma;
}

export default getPrisma;
