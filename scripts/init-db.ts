import { execSync } from 'child_process';

async function initDatabase() {
  console.info('Initializing database for MongoDB...');

  console.info('Running prisma generate...');
  try {
    execSync('bunx prisma generate', { stdio: 'inherit' });
  } catch {
    console.error('Failed to run prisma generate');
    process.exit(1);
  }

  console.info('Pushing schema to MongoDB...');
  try {
    execSync('bunx prisma db push', { stdio: 'inherit' });
  } catch {
    console.error('Failed to push schema to MongoDB');
    process.exit(1);
  }

  console.info('Database initialization complete.');
}

initDatabase();
