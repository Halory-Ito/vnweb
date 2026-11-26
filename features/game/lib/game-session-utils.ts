import { eq, sql } from 'drizzle-orm'

import { GameInfoTable, GamePlayTable, GameRecordTable } from '@/db/schema'
import { db } from '@/lib/drizzle'
import { getLatestTimerEndAt } from '@/lib/server/game-last-run'
import { backupGameSave } from '@/lib/server/game-save-backup'

export type FinalizeGameSessionResult = {
  finalized: boolean
  elapsedSeconds: number
}

const globalForFinalize = globalThis as typeof globalThis & {
  __vnwebInFlightGameFinalizations?: Map<number, Promise<FinalizeGameSessionResult>>
}

function getInFlightMap(): Map<number, Promise<FinalizeGameSessionResult>> {
  if (!globalForFinalize.__vnwebInFlightGameFinalizations) {
    globalForFinalize.__vnwebInFlightGameFinalizations = new Map<
      number,
      Promise<FinalizeGameSessionResult>
    >()
  }
  return globalForFinalize.__vnwebInFlightGameFinalizations
}

const safeDiffSeconds = (start: string, end: Date) => {
  const startDate = new Date(start)
  if (Number.isNaN(startDate.getTime())) {
    return 0
  }

  const seconds = Math.floor((end.getTime() - startDate.getTime()) / 1000)
  return Math.max(0, seconds)
}

async function runFinalizeGameSession(
  gameId: number,
  options?: { endedAt?: Date },
): Promise<FinalizeGameSessionResult> {
  const { stopTrackingGame } = await import('@/lib/server/game-tracker')
  stopTrackingGame(gameId)

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

  const rawEnd = options?.endedAt ?? new Date()
  const launchMs = play.lastLaunchedAt ? Date.parse(play.lastLaunchedAt) : Number.NaN
  const endedAt =
    Number.isFinite(launchMs) && rawEnd.getTime() < launchMs ? new Date(launchMs) : rawEnd
  const endedAtIso = endedAt.toISOString()
  const elapsedSeconds = safeDiffSeconds(play.lastLaunchedAt || '', endedAt)

  await db.insert(GameRecordTable).values({
    gameId,
    playTime: elapsedSeconds,
    playDate: play.lastLaunchedAt || endedAtIso,
  })

  const allRecords = await db
    .select({
      playDate: GameRecordTable.playDate,
      playTime: GameRecordTable.playTime,
    })
    .from(GameRecordTable)
    .where(eq(GameRecordTable.gameId, gameId))

  const latestTimerEndAt = getLatestTimerEndAt(allRecords) || endedAtIso

  await db
    .update(GamePlayTable)
    .set({
      totalPlayTime: sql`${GamePlayTable.totalPlayTime} + ${elapsedSeconds}`,
      playCount: sql`${GamePlayTable.playCount} + 1`,
      lastLaunchedAt: latestTimerEndAt,
      isRunning: 0,
      pid: 0,
    })
    .where(eq(GamePlayTable.id, play.id))

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

export const finalizeGameSession = (
  gameId: number,
  options?: { endedAt?: Date },
): Promise<FinalizeGameSessionResult> => {
  const inFlight = getInFlightMap()
  const existing = inFlight.get(gameId)
  if (existing) {
    return existing
  }

  const task = runFinalizeGameSession(gameId, options).finally(() => {
    if (inFlight.get(gameId) === task) {
      inFlight.delete(gameId)
    }
  })

  inFlight.set(gameId, task)
  return task
}
