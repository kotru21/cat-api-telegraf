import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import { createClient } from '@libsql/client';

dotenv.config();

async function initDatabase() {
  const NODE_ENV = process.env.NODE_ENV || 'development';
  const PRISMA_DIR = path.join(process.cwd(), 'prisma');
  const SCHEMA_PATH = path.join(PRISMA_DIR, 'schema.prisma');

  console.log(`Initializing database for environment: ${NODE_ENV}`);

  let sourceSchema;

  if (NODE_ENV === 'production') {
    sourceSchema = path.join(PRISMA_DIR, 'schema.postgres.prisma');
  } else {
    sourceSchema = path.join(PRISMA_DIR, 'schema.sqlite.prisma');
  }

  if (!fs.existsSync(sourceSchema)) {
    console.error(`Source schema not found: ${sourceSchema}`);
    process.exit(1);
  }

  console.log(`Copying ${path.basename(sourceSchema)} to schema.prisma...`);
  fs.copyFileSync(sourceSchema, SCHEMA_PATH);

  console.log('Running prisma generate...');
  try {
    execSync('bunx prisma generate', { stdio: 'inherit' });
  } catch (error) {
    console.error('Failed to run prisma generate');
    process.exit(1);
  }

  // Создаём таблицы в зависимости от окружения
  if (NODE_ENV === 'production') {
    // Production (PostgreSQL): используем Prisma миграции
    console.log('Applying Prisma migrations for production...');
    try {
      execSync('bunx prisma migrate deploy', { stdio: 'inherit' });
      console.log('Production migrations applied successfully');
    } catch (error) {
      console.error('Failed to apply production migrations');
      console.error('Make sure migrations are created before deploying to production');
      process.exit(1);
    }
  } else {
    // Development (SQLite): создаём таблицы напрямую через SQL
    console.log('Creating database tables for development...');
    let dbUrl = process.env.DATABASE_URL || 'file:./prisma/main.db';

    // Преобразуем относительный путь в абсолютный, как это делает prisma.config.js
    if (dbUrl.startsWith('file:')) {
      const relativePath = dbUrl.replace('file:', '');
      const absolutePath = path.resolve(process.cwd(), relativePath);
      dbUrl = `file:${absolutePath}`;
      console.log(`Using database at: ${absolutePath}`);
    }

    try {
      const client = createClient({
        url: dbUrl,
      });

      // Создаём таблицы по одной
      await client.execute(`
CREATE TABLE IF NOT EXISTS "Cat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "count" INTEGER NOT NULL DEFAULT 0,
    "breed_name" TEXT,
    "image_url" TEXT,
    "description" TEXT,
    "wikipedia_url" TEXT,
    "breed_id" TEXT,
    "temperament" TEXT,
    "origin" TEXT,
    "life_span" TEXT,
    "weight_imperial" TEXT,
    "weight_metric" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
)`);

      await client.execute(`
CREATE TABLE IF NOT EXISTS "user_likes" (
    "user_id" TEXT NOT NULL,
    "cat_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("user_id", "cat_id"),
    CONSTRAINT "user_likes_cat_id_fkey" FOREIGN KEY ("cat_id") REFERENCES "Cat" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
)`);

      await client.execute(`CREATE INDEX IF NOT EXISTS "idx_cat_count" ON "Cat"("count")`);
      await client.execute(`CREATE INDEX IF NOT EXISTS "idx_ul_cat" ON "user_likes"("cat_id")`);
      await client.execute(`CREATE INDEX IF NOT EXISTS "idx_ul_user" ON "user_likes"("user_id")`);

      // Закрываем соединение
      client.close();

      console.log('Database tables created successfully');
    } catch (error) {
      console.error('Failed to create database tables:', error);
      process.exit(1);
    }
  }

  console.log('Database initialization complete.');
}

// Запускаем инициализацию
initDatabase().catch((error) => {
  console.error('Initialization failed:', error);
  process.exit(1);
});
