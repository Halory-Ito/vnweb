import { defineConfig } from 'drizzle-kit'

import { databaseUrl } from './lib/server/database-config.mjs'

export default defineConfig({
  out: './drizzle',
  schema: './db/schema.ts',
  dialect: 'sqlite',
  dbCredentials: {
    url: databaseUrl,
  },
})
