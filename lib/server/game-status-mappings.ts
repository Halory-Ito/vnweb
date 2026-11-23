import { eq } from 'drizzle-orm'

import { ensureGameStatusSchema, runGameStatusTransaction } from './game-status-settings'
import { GameStatusMappingTable, GameStatusTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

import type { GameStatusMappings, GameStatusSyncProvider } from '@/types'

export async function readGameStatusMappings(): Promise<GameStatusMappings> {
  await ensureGameStatusSchema()
  const rows = await db.select().from(GameStatusMappingTable)
  return Object.fromEntries(
    rows.map(({ statusId, bangumi, vndb }) => [
      statusId,
      { bangumi: bangumi ?? undefined, vndb: vndb ?? undefined },
    ]),
  )
}

export async function updateGameStatusMapping(
  statusId: number,
  provider: GameStatusSyncProvider,
  target: number | null,
) {
  await ensureGameStatusSchema()
  return runGameStatusTransaction(async (tx) => {
    const [status] = await tx
      .select({ id: GameStatusTable.id })
      .from(GameStatusTable)
      .where(eq(GameStatusTable.id, statusId))
    if (!status) return false
    await tx
      .insert(GameStatusMappingTable)
      .values({ statusId, [provider]: target })
      .onConflictDoUpdate({
        target: GameStatusMappingTable.statusId,
        set: { [provider]: target },
      })
    return true
  })
}
