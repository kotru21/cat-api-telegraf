import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function checkTables() {
  let dbUrl = process.env.DATABASE_URL || 'file:./prisma/main.db';

  if (dbUrl.startsWith('file:')) {
    const relativePath = dbUrl.replace('file:', '');
    const absolutePath = path.resolve(process.cwd(), relativePath);
    dbUrl = `file:${absolutePath}`;
    console.log(`Checking database at: ${absolutePath}`);
  }

  const client = createClient({ url: dbUrl });

  const result = await client.execute("SELECT name FROM sqlite_master WHERE type='table';");

  console.log('Tables in database:');
  console.log(result.rows);

  client.close();
}

checkTables().catch(console.error);
