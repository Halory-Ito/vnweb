import { drizzle } from 'drizzle-orm/libsql'
import fs from 'node:fs'
import path from 'node:path'

import { databaseUrl, getDbPath } from './server/database-config.mjs'

if (databaseUrl.startsWith('file:') && !databaseUrl.includes(':memory:')) {
  fs.mkdirSync(path.dirname(getDbPath()), { recursive: true })
}

export const db = drizzle({ connection: { url: databaseUrl } })
