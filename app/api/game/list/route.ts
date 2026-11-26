import { desc, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { GameInfoTable, GamePlayTable, GameRecordTable } from '@/db/schema'
import { db } from '@/lib/drizzle'
import { buildLatestTimerEndAtMap } from '@/lib/server/game-last-run'
import { gameMetadataSearchColumns, getGameSearchMetadata } from '@/lib/server/game-metadata-search'

const getGameCardList = async (req: NextRequest) => {
  try {
    const includeNsfw =
      (req.nextUrl.searchParams.get('includeNsfw') || 'true').trim().toLowerCase() !== 'false'

    const gameListQuery = db
      .select({
        id: GameInfoTable.id,
        name: GameInfoTable.name,
        nameCn: GameInfoTable.nameCn,
        cover: GameInfoTable.cover,
        ...gameMetadataSearchColumns,
        tags: GameInfoTable.tags,
        createdAt: GameInfoTable.createdAt,
      })
      .from(GameInfoTable)
      .orderBy(desc(GameInfoTable.id))

    const games = includeNsfw
      ? await gameListQuery
      : await gameListQuery.where(eq(GameInfoTable.nsfw, 0))

    const plays = await db
      .select({
        gameId: GamePlayTable.gameId,
        totalPlayTime: GamePlayTable.totalPlayTime,
        rating: GamePlayTable.rating,
        status: GamePlayTable.status,
      })
      .from(GamePlayTable)

    const recordRows = await db
      .select({
        gameId: GameRecordTable.gameId,
        playDate: GameRecordTable.playDate,
        playTime: GameRecordTable.playTime,
      })
      .from(GameRecordTable)

    const latestTimerEndAtMap = buildLatestTimerEndAtMap(recordRows)

    const playMap = new Map(
      plays.map((play) => [
        play.gameId,
        {
          totalPlayTime: play.totalPlayTime ?? 0,
          rating: play.rating ?? 0,
          status: play.status ?? 0,
        },
      ]),
    )

    const data = games.map((game) => {
      const play = playMap.get(game.id)
      return {
        id: String(game.id),
        title: game.nameCn || game.name,
        originalTitle: game.name,
        searchMetadata: getGameSearchMetadata(game),
        tags: game.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        cover: game.cover || '/cover/wa2.jpg',
        developer: game.developer,
        publisher: game.publisher,
        publishAt: game.date || '',
        lastRunAt: latestTimerEndAtMap.get(game.id) || '',
        addedAt: game.createdAt || '',
        playTime: play?.totalPlayTime || 0,
        rating: play?.rating || 0,
        status: play?.status ?? 0,
      }
    })

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Get game card list failed:', error)
    return NextResponse.json({ error: 'Failed to get game card list' }, { status: 500 })
  }
}

export { getGameCardList as GET }
