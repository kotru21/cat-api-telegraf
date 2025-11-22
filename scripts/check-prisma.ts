// Connectivity check for Prisma/SQLite without starting the app
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Ensure client can connect and schema has the expected tables
    const tables =
      (await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table' AND name IN ('Cat','user_likes')`) as any[];
    const names = (tables || []).map((t: any) => t.name);
    const ok = names.includes('Cat') && names.includes('user_likes');
    if (!ok) {
      console.error('Prisma check: required tables missing', { names });
      process.exit(2);
    }
    // Quick client call to verify model works
    const count = await prisma.cat.count();
    console.log('PRISMA_OK', { tables: names, catCount: count });
    process.exit(0);
  } catch (err) {
    console.error('PRISMA_ERR', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
