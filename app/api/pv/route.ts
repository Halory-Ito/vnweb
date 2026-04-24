import { and, desc, eq, like, or } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { GameInfoTable, GamePvTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

const normalizeText = (value: unknown) => {
  if (typeof value !== 'string') {
    return ''
  }
  return value.trim()
}

const parsePositiveNumber = (value: string | null) => {
  if (!value) {
    return null
  }

  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null
  }

  return parsed
}

const getPvList = async (req: NextRequest) => {
  try {
    const keyword = normalizeText(req.nextUrl.searchParams.get('keyword'))
    const gameId = parsePositiveNumber(req.nextUrl.searchParams.get('gameId'))

    const conditions = []

    if (gameId) {
      conditions.push(eq(GamePvTable.gameId, gameId))
    }

    if (keyword) {
      const keywordPattern = `%${keyword}%`
      conditions.push(
        or(
          like(GamePvTable.name, keywordPattern),
          like(GamePvTable.url, keywordPattern),
          like(GameInfoTable.name, keywordPattern),
          like(GameInfoTable.nameCn, keywordPattern),
        ),
      )
    }

    const rows = await db
      .select({
        id: GamePvTable.id,
        gameId: GamePvTable.gameId,
        name: GamePvTable.name,
        url: GamePvTable.url,
        createdAt: GamePvTable.createdAt,
        updatedAt: GamePvTable.updatedAt,
        gameName: GameInfoTable.name,
        gameNameCn: GameInfoTable.nameCn,
        gameCover: GameInfoTable.cover,
        gameBg: GameInfoTable.bg,
      })
      .from(GamePvTable)
      .innerJoin(GameInfoTable, eq(GamePvTable.gameId, GameInfoTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(GamePvTable.id))

    return NextResponse.json({
      data: {
        items: rows,
      },
    })
  } catch (error) {
    console.error('Get pv list failed:', error)
    return NextResponse.json(
      { error: 'Failed to get pv list' },
      { status: 500 },
    )
  }
}

const createPv = async (req: NextRequest) => {
  try {
    const payload = (await req.json().catch(() => ({}))) as {
      gameId?: number
      name?: string
      url?: string
    }

    const gameId = Number(payload.gameId)
    const name = normalizeText(payload.name)
    const url = normalizeText(payload.url)

    if (!Number.isInteger(gameId) || gameId <= 0) {
      return NextResponse.json({ error: '无效的游戏 id' }, { status: 400 })
    }

    if (!name || !url) {
      return NextResponse.json(
        { error: '游戏、PV名称和链接不能为空' },
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
      .insert(GamePvTable)
      .values({
        gameId,
        name,
        url,
        createdAt: now,
        updatedAt: now,
      })
      .returning({
        id: GamePvTable.id,
        gameId: GamePvTable.gameId,
        name: GamePvTable.name,
        url: GamePvTable.url,
        createdAt: GamePvTable.createdAt,
        updatedAt: GamePvTable.updatedAt,
      })

    return NextResponse.json({
      data: {
        item: inserted[0],
      },
    })
  } catch (error) {
    console.error('Create pv failed:', error)
    return NextResponse.json({ error: 'Failed to create pv' }, { status: 500 })
  }
}

export { getPvList as GET, createPv as POST }
