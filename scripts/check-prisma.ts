/* eslint-disable no-console */
// Connectivity check for Prisma (MongoDB)
// Verifies that:
// 1. Prisma client can connect to the database
// 2. Models (Cat, user_likes) are accessible
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Quick client call to verify models work (this also tests connection)
    const catCount = await prisma.cat.count();
    const likesCount = await prisma.user_likes.count();

    console.log('PRISMA_OK', {
      catCount,
      likesCount,
      database: 'mongodb',
    });
    process.exit(0);
  } catch (err) {
    console.error('PRISMA_ERR', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
