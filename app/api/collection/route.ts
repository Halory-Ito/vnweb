import dayjs from 'dayjs'
import { desc, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import {
  CollectionGameTable,
  CollectionTable,
  GameInfoTable,
  GamePlayTable,
} from '@/db/schema'
import { db } from '@/lib/drizzle'

export const dynamic = 'force-dynamic'

type CreateCollectionPayload = {
  name?: string
}

const getCollections = async () => {
  try {
    const collections = await db
      .select({
        id: CollectionTable.id,
        name: CollectionTable.name,
        createdAt: CollectionTable.createdAt,
        updatedAt: CollectionTable.updatedAt,
      })
      .from(CollectionTable)
      .orderBy(desc(CollectionTable.id))

    if (collections.length === 0) {
      return NextResponse.json({ data: [] })
    }

    const links = await db
      .select({
        linkId: CollectionGameTable.id,
        collectionId: CollectionGameTable.collectionId,
        gameId: GameInfoTable.id,
        gameName: GameInfoTable.name,
        gameCover: GameInfoTable.cover,
        gameIcon: GameInfoTable.icon,
        gameDate: GameInfoTable.date,
        gameAddedAt: GameInfoTable.createdAt,
        gameLastRunAt: GamePlayTable.lastLaunchedAt,
        gamePlayTime: GamePlayTable.totalPlayTime,
        gameRating: GamePlayTable.rating,
      })
      .from(CollectionGameTable)
      .innerJoin(
        GameInfoTable,
        eq(CollectionGameTable.gameId, GameInfoTable.id),
      )
      .leftJoin(
        GamePlayTable,
        eq(CollectionGameTable.gameId, GamePlayTable.gameId),
      )
      .orderBy(desc(CollectionGameTable.id))

    const grouped = new Map<
      number,
      Array<{
        linkId: number
        id: number
        name: string
        cover: string
        icon: string
        date: string
        addedAt: string
        lastRunAt: string
        playTime: number
        rating: number
      }>
    >()

    for (const link of links) {
      const current = grouped.get(link.collectionId) ?? []
      current.push({
        linkId: link.linkId,
        id: link.gameId,
        name: link.gameName,
        cover: link.gameCover || '',
        icon: link.gameIcon || '',
        date: link.gameDate || '',
        addedAt: link.gameAddedAt || '',
        lastRunAt: link.gameLastRunAt || '',
        playTime: link.gamePlayTime || 0,
        rating: link.gameRating || 0,
      })
      grouped.set(link.collectionId, current)
    }

    const data = collections.map((collection) => {
      const games = grouped.get(collection.id) ?? []
      const firstGame = games[0]
      return {
        id: collection.id,
        name: collection.name,
        createdAt: collection.createdAt,
        updatedAt: collection.updatedAt,
        games,
        firstGameCover: firstGame?.cover || '',
      }
    })

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Get collections failed:', error)
    return NextResponse.json(
      { error: 'Failed to get collections' },
      { status: 500 },
    )
  }
}

const createCollection = async (req: NextRequest) => {
  try {
    const payload = (await req
      .json()
      .catch(() => ({}))) as CreateCollectionPayload
    const name = (payload.name || '').trim()

    if (!name) {
      return NextResponse.json({ error: '收藏夹名称不能为空' }, { status: 400 })
    }

    const exists = await db
      .select({ id: CollectionTable.id, name: CollectionTable.name })
      .from(CollectionTable)
      .where(eq(CollectionTable.name, name))
      .limit(1)

    if (exists[0]) {
      return NextResponse.json({ data: exists[0] })
    }

    const now = dayjs().toISOString()
    const inserted = await db
      .insert(CollectionTable)
      .values({
        name,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: CollectionTable.id, name: CollectionTable.name })

    return NextResponse.json({ data: inserted[0] })
  } catch (error) {
    console.error('Create collection failed:', error)
    return NextResponse.json(
      { error: 'Failed to create collection' },
      { status: 500 },
    )
  }
}

export { getCollections as GET, createCollection as POST }
