import { eq, ne, sql } from 'drizzle-orm'

import { readConfig } from './config-rw'
import { GamePlayTable, GameStatusMappingTable, GameStatusTable } from '@/db/schema'
import {
  GAME_PLAY_STATUS_OPTIONS,
  UNKNOWN_GAME_STATUS,
  getGamePlayStatusLabel,
  normalizeGameStatusNames,
} from '@/features/game/lib/game-status'
import { db } from '@/lib/drizzle'
import { DEFAULT_STATUS_COLOR_SETTINGS } from '@/lib/settings/status-settings'

let schemaReady: Promise<void> | undefined
type StatusTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]
let statusQueue = Promise.resolve()

function enqueueStatusOperation<T>(operation: () => Promise<T>) {
  const task = statusQueue.then(operation)
  statusQueue = task.then(
    () => {},
    () => {},
  )
  return task
}

export function runGameStatusTransaction<T>(operation: (tx: StatusTransaction) => Promise<T>) {
  return enqueueStatusOperation(async () => {
    for (let attempt = 0; ; attempt += 1) {
      try {
        return await db.transaction(operation)
      } catch (error) {
        if ((error as { code?: string }).code !== 'SQLITE_BUSY' || attempt >= 5) throw error
        // The local libSQL driver does not wait for another writer to commit.
        await new Promise((resolve) => setTimeout(resolve, 20 * 2 ** attempt))
      }
    }
  })
}

export function ensureGameStatusSchema() {
  schemaReady ??= initialize().catch((error) => {
    schemaReady = undefined
    throw error
  })
  return schemaReady
}

async function initialize() {
  const config = await readConfig()
  const legacy = (
    config.settings as {
      appearance?: { status?: { names?: unknown; color?: Record<string, unknown> } }
    }
  )?.appearance?.status
  const names = normalizeGameStatusNames(legacy?.names)

  await runGameStatusTransaction(async (tx) => {
    await tx.run(sql`
      CREATE TABLE IF NOT EXISTS game_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        color TEXT NOT NULL
      )
    `)
    await tx.run(sql`
      CREATE TABLE IF NOT EXISTS game_status_mapping (
        status_id INTEGER PRIMARY KEY,
        bangumi INTEGER,
        vndb INTEGER
      )
    `)
    await tx.run(sql`
      CREATE TABLE IF NOT EXISTS game_status_push (
        game_id INTEGER NOT NULL,
        provider TEXT NOT NULL,
        account_id TEXT NOT NULL,
        external_id TEXT NOT NULL,
        target INTEGER NOT NULL,
        pushed_at TEXT NOT NULL,
        PRIMARY KEY (game_id, provider)
      )
    `)
    await tx.run(sql`
      CREATE TRIGGER IF NOT EXISTS game_status_push_after_game_delete
      AFTER DELETE ON game_info
      BEGIN
        DELETE FROM game_status_push WHERE game_id = OLD.id;
      END
    `)
    const [marker] = await tx
      .select()
      .from(GameStatusTable)
      .where(eq(GameStatusTable.id, UNKNOWN_GAME_STATUS))
    if (marker) return

    await tx.insert(GameStatusTable).values([
      { id: UNKNOWN_GAME_STATUS, name: '未知', color: DEFAULT_STATUS_COLOR_SETTINGS[0] },
      ...GAME_PLAY_STATUS_OPTIONS.map((id) => {
        const color = legacy?.color?.[id]
        return {
          id,
          name: names[id],
          color:
            typeof color === 'string' && /^#[\da-f]{6}$/i.test(color.trim())
              ? color.trim()
              : DEFAULT_STATUS_COLOR_SETTINGS[id],
        }
      }),
    ])

    // Existing import paths can still insert the default status after it is deleted.
    await tx.run(sql`
      CREATE TRIGGER IF NOT EXISTS game_play_status_after_insert
      AFTER INSERT ON game_play
      WHEN NOT EXISTS (SELECT 1 FROM game_status WHERE id = NEW.status)
      BEGIN
        UPDATE game_play SET status = -1 WHERE id = NEW.id;
      END
    `)
    await tx.run(sql`
      CREATE TRIGGER IF NOT EXISTS game_play_status_after_update
      AFTER UPDATE OF status ON game_play
      WHEN NOT EXISTS (SELECT 1 FROM game_status WHERE id = NEW.status)
      BEGIN
        UPDATE game_play SET status = -1 WHERE id = NEW.id;
      END
    `)
  })
}

export async function readGameStatusSettings() {
  await ensureGameStatusSchema()
  const rows = await enqueueStatusOperation(() =>
    db.select().from(GameStatusTable).where(ne(GameStatusTable.id, UNKNOWN_GAME_STATUS)).all(),
  )
  return {
    names: Object.fromEntries(rows.map(({ id, name }) => [id, name])),
    data: Object.fromEntries(rows.map(({ id, color }) => [id, color])),
  }
}

export async function updateGameStatusFields(
  updates: Record<string, unknown>,
  field: 'name' | 'color',
) {
  await ensureGameStatusSchema()
  await runGameStatusTransaction(async (tx) => {
    for (const [key, value] of Object.entries(updates)) {
      const id = Number(key)
      if (!Number.isSafeInteger(id) || id < 0 || typeof value !== 'string') continue
      if (field === 'color' && !/^#[\da-f]{6}$/i.test(value)) continue
      const name = value.trim() || getGamePlayStatusLabel(id)
      if (
        field === 'name' &&
        !value.trim() &&
        !GAME_PLAY_STATUS_OPTIONS.some((status) => status === id)
      )
        continue
      await tx
        .update(GameStatusTable)
        .set(field === 'color' ? { color: value } : { name })
        .where(eq(GameStatusTable.id, id))
    }
  })
}

export async function addGameStatus(name: string) {
  await ensureGameStatusSchema()
  await runGameStatusTransaction(async (tx) => {
    await tx.insert(GameStatusTable).values({ name, color: DEFAULT_STATUS_COLOR_SETTINGS[0] })
  })
}

export async function deleteGameStatus(id: number) {
  await ensureGameStatusSchema()
  return runGameStatusTransaction(async (tx) => {
    await tx.delete(GameStatusMappingTable).where(eq(GameStatusMappingTable.statusId, id))
    await tx.delete(GameStatusTable).where(eq(GameStatusTable.id, id))
    const updated = await tx
      .update(GamePlayTable)
      .set({ status: UNKNOWN_GAME_STATUS })
      .where(eq(GamePlayTable.status, id))
    return updated.rowsAffected
  })
}
