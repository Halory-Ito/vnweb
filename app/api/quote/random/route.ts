import { eq, ne, sql } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { CharacterTable, GameInfoTable, GameQuoteTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

const getRandomQuote = async (req: NextRequest) => {
  try {
    const includeNsfw =
      (req.nextUrl.searchParams.get('includeNsfw') || 'true').trim().toLowerCase() !== 'false'

    const rows = await db
      .select({
        id: GameQuoteTable.id,
        gameId: GameQuoteTable.gameId,
        content: GameQuoteTable.content,
        characterId: GameQuoteTable.characterId,
        context: GameQuoteTable.context,
        createdAt: GameQuoteTable.createdAt,
        updatedAt: GameQuoteTable.updatedAt,
        gameName: GameInfoTable.name,
        gameNameCn: GameInfoTable.nameCn,
        gameCover: GameInfoTable.cover,
        characterName: CharacterTable.name,
        characterImage: CharacterTable.imageUrl,
      })
      .from(GameQuoteTable)
      .innerJoin(GameInfoTable, eq(GameQuoteTable.gameId, GameInfoTable.id))
      .leftJoin(CharacterTable, eq(GameQuoteTable.characterId, CharacterTable.vndbId))
      .where(includeNsfw ? undefined : ne(GameInfoTable.nsfw, 1))
      .orderBy(sql`random()`)
      .limit(1)

    const row = rows[0]
    const item = row
      ? {
          ...row,
          characterName: row.characterName || '',
          characterImage: row.characterImage || '',
        }
      : null

    return NextResponse.json({ data: { item } })
  } catch (error) {
    console.error('Get random quote failed:', error)
    return NextResponse.json({ error: 'Failed to get random quote' }, { status: 500 })
  }
}

export { getRandomQuote as GET }
