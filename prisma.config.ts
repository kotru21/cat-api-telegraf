/* eslint-env node */
/* eslint-disable no-undef */
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    db: {
      provider: 'sqlite',
      url: 'file:./prisma/main.db',
    },
  },
});
