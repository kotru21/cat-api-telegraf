import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

// Singleton Prisma client
let prisma;
export function getPrisma() {
  if (!prisma) {
    const adapter = new PrismaLibSql({
      url: process.env.DATABASE_URL,
    });
    prisma = new PrismaClient({ adapter });
  }
  return prisma;
}

export default getPrisma;
