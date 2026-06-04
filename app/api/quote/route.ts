import { and, desc, eq, like, or, between } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { CharacterTable, GameInfoTable, GameQuoteTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

const normalizeText = (value: unknown) => {
  if (typeof value !== 'string') {
    return ''
  }
  return value.trim()
}

const getQuoteList = async (req: NextRequest) => {
  try {
    const keyword = normalizeText(req.nextUrl.searchParams.get('keyword'))
    const gameId = req.nextUrl.searchParams.get('gameId')
    const characterId = normalizeText(req.nextUrl.searchParams.get('characterId'))
    const dateFrom = normalizeText(req.nextUrl.searchParams.get('dateFrom'))
    const dateTo = normalizeText(req.nextUrl.searchParams.get('dateTo'))

    const conditions = []

    if (gameId) {
      const parsedGameId = Number(gameId)
      if (Number.isInteger(parsedGameId) && parsedGameId > 0) {
        conditions.push(eq(GameQuoteTable.gameId, parsedGameId))
      }
    }

    if (characterId) {
      conditions.push(eq(GameQuoteTable.characterId, characterId))
    }

    if (keyword) {
      const keywordPattern = `%${keyword}%`
      conditions.push(
        or(
          like(GameQuoteTable.content, keywordPattern),
          like(GameQuoteTable.context, keywordPattern),
          like(GameInfoTable.name, keywordPattern),
          like(GameInfoTable.nameCn, keywordPattern),
        ),
      )
    }

    if (dateFrom && dateTo) {
      conditions.push(
        between(GameQuoteTable.createdAt, dateFrom, dateTo),
      )
    } else if (dateFrom) {
      conditions.push(
        like(GameQuoteTable.createdAt, `${dateFrom}%`),
      )
    } else if (dateTo) {
      conditions.push(
        like(GameQuoteTable.createdAt, `${dateTo}%`),
      )
    }

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
      })
      .from(GameQuoteTable)
      .innerJoin(GameInfoTable, eq(GameQuoteTable.gameId, GameInfoTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(GameQuoteTable.id))

    // 获取角色名称和图片
    const items = await Promise.all(
      rows.map(async (row) => {
        let characterName = ''
        let characterImage = ''
        if (row.characterId) {
          const character = await db
            .select({ name: CharacterTable.name, imageUrl: CharacterTable.imageUrl })
            .from(CharacterTable)
            .where(eq(CharacterTable.vndbId, row.characterId))
            .limit(1)
          characterName = character[0]?.name || ''
          characterImage = character[0]?.imageUrl || ''
        }
        return {
          ...row,
          characterName,
          characterImage,
        }
      }),
    )

    return NextResponse.json({
      data: {
        items,
      },
    })
  } catch (error) {
    console.error('Get quote list failed:', error)
    return NextResponse.json(
      { error: 'Failed to get quote list' },
      { status: 500 },
    )
  }
}

const createQuote = async (req: NextRequest) => {
  try {
    const payload = (await req.json().catch(() => ({}))) as {
      gameId?: number
      content?: string
      characterId?: string
      context?: string
    }

    const gameId = Number(payload.gameId)
    const content = normalizeText(payload.content)
    const characterId = normalizeText(payload.characterId)
    const context = normalizeText(payload.context)

    if (!Number.isInteger(gameId) || gameId <= 0) {
      return NextResponse.json({ error: '无效的游戏 id' }, { status: 400 })
    }

    if (!content) {
      return NextResponse.json(
        { error: '台词内容不能为空' },
        { status: 400 },
      )
    }

    const game = await db
      .select({ id: GameInfoTable.id })
      .from(GameInfoTable)
      .where(eq(GameInfoTable.id, gameId))
      .limit(1)

    if (!game[0]) {
      return NextResponse.json({ error: '游戏不存在' }, { status: 404 })
    }

    const now = new Date().toISOString()
    const inserted = await db
      .insert(GameQuoteTable)
      .values({
        gameId,
        content,
        characterId,
        context,
        createdAt: now,
        updatedAt: now,
      })
      .returning({
        id: GameQuoteTable.id,
        gameId: GameQuoteTable.gameId,
        content: GameQuoteTable.content,
        characterId: GameQuoteTable.characterId,
        context: GameQuoteTable.context,
        createdAt: GameQuoteTable.createdAt,
        updatedAt: GameQuoteTable.updatedAt,
      })

    return NextResponse.json({
      data: {
        item: inserted[0],
      },
    })
  } catch (error) {
    console.error('Create quote failed:', error)
    return NextResponse.json(
      { error: 'Failed to create quote' },
      { status: 500 },
    )
  }
}

export { getQuoteList as GET, createQuote as POST }
