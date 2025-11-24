/* eslint-env node */
/* eslint-disable no-undef */
import { defineConfig } from 'prisma/config';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
