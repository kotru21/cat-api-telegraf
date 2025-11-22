/* eslint-env node */
/* eslint-disable no-undef */
import 'dotenv/config';
import { defineConfig } from 'prisma/config';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    db: {
      provider: 'sqlite',
      url: process.env.DATABASE_URL?.startsWith('file:')
        ? `file:${resolve(__dirname, process.env.DATABASE_URL.replace('file:', ''))}`
        : process.env.DATABASE_URL,
    },
  },
});
