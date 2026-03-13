import 'dotenv/config'
import { drizzle } from 'drizzle-orm/libsql'

// You can specify any property from the libsql connection options
const dbUrl = process.env.DB_FILE_NAME?.trim() || 'file:./local.db'

export const db = drizzle({ connection: { url: dbUrl } })
