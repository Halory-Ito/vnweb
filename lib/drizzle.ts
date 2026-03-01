import 'dotenv/config'
import { drizzle } from 'drizzle-orm/libsql'

// You can specify any property from the libsql connection options
export const db = drizzle({ connection: { url: process.env.DB_FILE_NAME! } })
