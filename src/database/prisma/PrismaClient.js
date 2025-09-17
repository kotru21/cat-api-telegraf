import { PrismaClient } from "@prisma/client";

// Singleton Prisma client
let prisma;
export function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

export default getPrisma;
