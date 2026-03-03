import dayjs from 'dayjs'
import { eq, sql } from 'drizzle-orm'

import { GamePlayTable, GameRecordTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

const safeDiffSeconds = (start: string, end: Date) => {
  const startDate = new Date(start)
  if (Number.isNaN(startDate.getTime())) {
    return 0
  }

  const seconds = Math.floor((end.getTime() - startDate.getTime()) / 1000)
  return Math.max(0, seconds)
}

export const finalizeGameSession = async (gameId: number) => {
  const rows = await db
    .select({
      id: GamePlayTable.id,
      isRunning: GamePlayTable.isRunning,
      lastLaunchedAt: GamePlayTable.lastLaunchedAt,
    })
    .from(GamePlayTable)
    .where(eq(GamePlayTable.gameId, gameId))
    .limit(1)

  const play = rows[0]
  if (!play || play.isRunning !== 1) {
    return { finalized: false, elapsedSeconds: 0 }
  }

  const endedAt = new Date()
  const endedAtIso = endedAt.toISOString()
  const elapsedSeconds = safeDiffSeconds(play.lastLaunchedAt || '', endedAt)

  await db
    .update(GamePlayTable)
    .set({
      totalPlayTime: sql`${GamePlayTable.totalPlayTime} + ${elapsedSeconds}`,
      playCount: sql`${GamePlayTable.playCount} + 1`,
      lastLaunchedAt: endedAtIso,
      isRunning: 0,
    })
    .where(eq(GamePlayTable.id, play.id))

  await db.insert(GameRecordTable).values({
    gameId,
    playTime: elapsedSeconds,
    playDate: dayjs(endedAt).format('YYYY-MM-DD'),
  })

  return {
    finalized: true,
    elapsedSeconds,
  }
}
