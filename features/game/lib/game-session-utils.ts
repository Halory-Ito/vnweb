import { eq, sql } from 'drizzle-orm'

import { GameInfoTable, GamePlayTable, GameRecordTable } from '@/db/schema'
import { db } from '@/lib/drizzle'
import { backupGameSave } from '@/lib/server/game-save-backup'

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
    playDate: play.lastLaunchedAt || endedAtIso,
  })

  // 游戏结束时备份存档
  try {
    const gameInfo = await db
      .select({
        name: GameInfoTable.name,
        saveDir: GameInfoTable.saveDir,
      })
      .from(GameInfoTable)
      .where(eq(GameInfoTable.id, gameId))
      .limit(1)

    if (gameInfo[0]?.saveDir) {
      await backupGameSave(gameInfo[0].name, gameInfo[0].saveDir)
    }
  } catch (error) {
    console.error('[GameSession] Save backup failed:', error)
  }

  return {
    finalized: true,
    elapsedSeconds,
  }
}
