import { sql } from 'drizzle-orm'

import { db } from '@/lib/drizzle'

let schemaReady: Promise<void> | null = null

/** 确保 game_play.trackingMode 与 trackingTarget 列存在 */
export function ensureGameTrackingSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const columns = await db.all<{ name?: unknown }>(sql`PRAGMA table_info('game_play')`)
      const names = new Set(columns.map((column) => String(column.name ?? '')))

      if (!names.has('trackingMode')) {
        await db.run(sql`ALTER TABLE \`game_play\` ADD COLUMN \`trackingMode\` text DEFAULT 'file'`)
      }

      if (!names.has('trackingTarget')) {
        await db.run(sql`ALTER TABLE \`game_play\` ADD COLUMN \`trackingTarget\` text DEFAULT ''`)
      }
    })().catch((error) => {
      schemaReady = null
      throw error
    })
  }

  return schemaReady
}
