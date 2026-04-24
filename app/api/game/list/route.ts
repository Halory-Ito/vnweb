import { desc, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { GameInfoTable, GamePlayTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

const getGameCardList = async (req: NextRequest) => {
  try {
    const includeNsfw =
      (req.nextUrl.searchParams.get('includeNsfw') || 'true')
        .trim()
        .toLowerCase() !== 'false'

    const gameListQuery = db
      .select({
        id: GameInfoTable.id,
        name: GameInfoTable.name,
        nameCn: GameInfoTable.nameCn,
        cover: GameInfoTable.cover,
        date: GameInfoTable.date,
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
        lastLaunchedAt: GamePlayTable.lastLaunchedAt,
      })
      .from(GamePlayTable)

    const playMap = new Map(
      plays.map((play) => [
        play.gameId,
        {
          totalPlayTime: play.totalPlayTime ?? 0,
          rating: play.rating ?? 0,
          lastLaunchedAt: play.lastLaunchedAt ?? '',
        },
      ]),
    )

    const data = games.map((game) => {
      const play = playMap.get(game.id)
      return {
        id: String(game.id),
        title: game.nameCn || game.name,
        cover: game.cover || '/cover/wa2.jpg',
        publishAt: game.date || '',
        lastRunAt: play?.lastLaunchedAt || '',
        addedAt: game.createdAt || '',
        playTime: play?.totalPlayTime || 0,
        rating: play?.rating || 0,
      }
    })

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Get game card list failed:', error)
    return NextResponse.json(
      { error: 'Failed to get game card list' },
      { status: 500 },
    )
  }
}

export { getGameCardList as GET }
