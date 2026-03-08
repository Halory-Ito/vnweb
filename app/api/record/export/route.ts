import { desc } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { GameInfoTable, GamePlayTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

const toHours = (seconds: number) => Number((seconds / 3600).toFixed(2))

const normalizeTags = (raw: string) =>
  raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

const getRecordExport = async () => {
  try {
    const plays = await db
      .select({
        gameId: GamePlayTable.gameId,
        totalPlayTime: GamePlayTable.totalPlayTime,
      })
      .from(GamePlayTable)
      .orderBy(desc(GamePlayTable.totalPlayTime))

    const games = await db
      .select({
        id: GameInfoTable.id,
        name: GameInfoTable.name,
        nameCn: GameInfoTable.nameCn,
        cover: GameInfoTable.cover,
        tags: GameInfoTable.tags,
      })
      .from(GameInfoTable)

    const gameMap = new Map(games.map((item) => [Number(item.id), item]))

    const totalSeconds = plays.reduce(
      (sum, item) => sum + Math.max(0, Number(item.totalPlayTime || 0)),
      0,
    )

    const entries = plays
      .map((item) => {
        const game = gameMap.get(Number(item.gameId))
        if (!game) {
          return null
        }

        const seconds = Math.max(0, Number(item.totalPlayTime || 0))
        if (seconds <= 0) {
          return null
        }

        const ratio = totalSeconds > 0 ? seconds / totalSeconds : 0

        return {
          id: String(game.id),
          title: game.nameCn || game.name || `游戏 ${game.id}`,
          cover: game.cover || '/cover/wa2.jpg',
          tags: normalizeTags(game.tags || '').slice(0, 3),
          totalPlaySeconds: seconds,
          totalPlayHours: toHours(seconds),
          ratio: Number((ratio * 100).toFixed(2)),
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)

    return NextResponse.json({
      data: {
        totalPlaySeconds: totalSeconds,
        totalPlayHours: toHours(totalSeconds),
        entries,
      },
    })
  } catch (error) {
    console.error('Get export report failed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch export report' },
      { status: 500 },
    )
  }
}

export { getRecordExport as GET }
