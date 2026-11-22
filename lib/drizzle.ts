import { drizzle } from 'drizzle-orm/libsql'

import { databaseUrl } from './server/database-config.mjs'

export const db = drizzle({ connection: { url: databaseUrl } })
