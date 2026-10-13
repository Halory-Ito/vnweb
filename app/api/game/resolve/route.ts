import { and, eq, inArray, like, or, sql } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { GameIdMapTable, GameInfoTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

const VNDB_ID_PATTERN = /^v\d+$/i
const MAX_RESULTS = 10

/** 精确匹配 > 前缀匹配 > 包含匹配 */
const getMatchScore = (item: { name: string; nameCn: string }, keyword: string) => {
  const target = keyword.toLowerCase()
  const names = [item.nameCn, item.name].filter(Boolean).map((value) => value.toLowerCase())

  if (names.some((value) => value === target)) {
    return 3
  }
  if (names.some((value) => value.startsWith(target))) {
    return 2
  }
  return 1
}

type GameRow = {
  id: number
  name: string
  nameCn: string
  cover: string | null
  nsfw: number
}

const resolveGame = async (req: NextRequest) => {
  try {
    const keyword = (req.nextUrl.searchParams.get('keyword') || '').trim()
    if (!keyword) {
      return NextResponse.json({ error: '请提供游戏名称或 vndb_id' }, { status: 400 })
    }

    const includeNsfw =
      (req.nextUrl.searchParams.get('includeNsfw') || 'true').trim().toLowerCase() !== 'false'

    const fields = {
      id: GameInfoTable.id,
      name: GameInfoTable.name,
      nameCn: GameInfoTable.nameCn,
      cover: GameInfoTable.cover,
      nsfw: GameInfoTable.nsfw,
    }

    let rows: GameRow[] = []

    if (VNDB_ID_PATTERN.test(keyword)) {
      const maps = await db
        .select({ gameId: GameIdMapTable.gameId })
        .from(GameIdMapTable)
        .where(
          and(
            eq(GameIdMapTable.provider, 'vndb'),
            sql`lower(${GameIdMapTable.externalId}) = ${keyword.toLowerCase()}`,
          ),
        )

      const gameIds = [...new Set(maps.map((item) => item.gameId))]
      if (gameIds.length > 0) {
        rows = await db.select(fields).from(GameInfoTable).where(inArray(GameInfoTable.id, gameIds))
      }
    } else {
      const pattern = `%${keyword}%`
      rows = await db
        .select(fields)
        .from(GameInfoTable)
        .where(
          or(
            like(GameInfoTable.name, pattern),
            like(GameInfoTable.nameCn, pattern),
            like(GameInfoTable.ailases, pattern),
          ),
        )
        .limit(MAX_RESULTS * 2)
    }

    const items = rows
      .filter((row) => includeNsfw || row.nsfw !== 1)
      .map((row) => ({
        id: row.id,
        name: row.name,
        nameCn: row.nameCn,
        cover: row.cover || '',
        title: row.nameCn || row.name,
      }))
      .sort((left, right) => getMatchScore(right, keyword) - getMatchScore(left, keyword))
      .slice(0, MAX_RESULTS)

    return NextResponse.json({ data: { items } })
  } catch (error) {
    console.error('Resolve game failed:', error)
    return NextResponse.json({ error: 'Failed to resolve game' }, { status: 500 })
  }
}

export { resolveGame as GET }
