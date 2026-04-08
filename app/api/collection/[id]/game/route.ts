import dayjs from 'dayjs'
import { and, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import {
  CollectionGameTable,
  CollectionTable,
  GameInfoTable,
} from '@/db/schema'
import { db } from '@/lib/drizzle'

type AddGameToCollectionPayload = {
  gameId?: number
}

type MoveGamePayload = {
  gameId?: number
  targetCollectionId?: number
}

const addGameToCollection = async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await context.params
    const collectionId = Number(id)

    if (!Number.isInteger(collectionId) || collectionId <= 0) {
      return NextResponse.json({ error: '无效的收藏夹 id' }, { status: 400 })
    }

    const payload = (await req
      .json()
      .catch(() => ({}))) as AddGameToCollectionPayload
    const gameId = Number(payload.gameId)

    if (!Number.isInteger(gameId) || gameId <= 0) {
      return NextResponse.json({ error: '无效的游戏 id' }, { status: 400 })
    }

    const collection = await db
      .select({ id: CollectionTable.id })
      .from(CollectionTable)
      .where(eq(CollectionTable.id, collectionId))
      .limit(1)

    if (!collection[0]) {
      return NextResponse.json({ error: '收藏夹不存在' }, { status: 404 })
    }

    const game = await db
      .select({ id: GameInfoTable.id })
      .from(GameInfoTable)
      .where(eq(GameInfoTable.id, gameId))
      .limit(1)

    if (!game[0]) {
      return NextResponse.json({ error: '游戏不存在' }, { status: 404 })
    }

    const exists = await db
      .select({ id: CollectionGameTable.id })
      .from(CollectionGameTable)
      .where(
        and(
          eq(CollectionGameTable.collectionId, collectionId),
          eq(CollectionGameTable.gameId, gameId),
        ),
      )
      .limit(1)

    if (!exists[0]) {
      await db.insert(CollectionGameTable).values({ collectionId, gameId })
    }

    await db
      .update(CollectionTable)
      .set({ updatedAt: dayjs().toISOString() })
      .where(eq(CollectionTable.id, collectionId))

    return NextResponse.json({
      data: {
        collectionId,
        gameId,
        added: true,
      },
    })
  } catch (error) {
    console.error('Add game to collection failed:', error)
    return NextResponse.json(
      { error: 'Failed to add game to collection' },
      { status: 500 },
    )
  }
}

const removeGameFromCollection = async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await context.params
    const collectionId = Number(id)
    const gameId = Number(req.nextUrl.searchParams.get('gameId'))

    if (!Number.isInteger(collectionId) || collectionId <= 0) {
      return NextResponse.json({ error: '无效的收藏夹 id' }, { status: 400 })
    }

    if (!Number.isInteger(gameId) || gameId <= 0) {
      return NextResponse.json({ error: '无效的游戏 id' }, { status: 400 })
    }

    await db
      .delete(CollectionGameTable)
      .where(
        and(
          eq(CollectionGameTable.collectionId, collectionId),
          eq(CollectionGameTable.gameId, gameId),
        ),
      )

    await db
      .update(CollectionTable)
      .set({ updatedAt: dayjs().toISOString() })
      .where(eq(CollectionTable.id, collectionId))

    return NextResponse.json({
      data: {
        collectionId,
        gameId,
        removed: true,
      },
    })
  } catch (error) {
    console.error('Remove game from collection failed:', error)
    return NextResponse.json(
      { error: 'Failed to remove game from collection' },
      { status: 500 },
    )
  }
}

const moveGameToOtherCollection = async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await context.params
    const sourceCollectionId = Number(id)
    const payload = (await req.json().catch(() => ({}))) as MoveGamePayload
    const gameId = Number(payload.gameId)
    const targetCollectionId = Number(payload.targetCollectionId)

    if (!Number.isInteger(sourceCollectionId) || sourceCollectionId <= 0) {
      return NextResponse.json(
        { error: '无效的来源收藏夹 id' },
        { status: 400 },
      )
    }
    if (!Number.isInteger(targetCollectionId) || targetCollectionId <= 0) {
      return NextResponse.json(
        { error: '无效的目标收藏夹 id' },
        { status: 400 },
      )
    }
    if (!Number.isInteger(gameId) || gameId <= 0) {
      return NextResponse.json({ error: '无效的游戏 id' }, { status: 400 })
    }
    if (sourceCollectionId === targetCollectionId) {
      return NextResponse.json(
        { error: '目标收藏夹不能与来源一致' },
        { status: 400 },
      )
    }

    const target = await db
      .select({ id: CollectionTable.id })
      .from(CollectionTable)
      .where(eq(CollectionTable.id, targetCollectionId))
      .limit(1)

    if (!target[0]) {
      return NextResponse.json({ error: '目标收藏夹不存在' }, { status: 404 })
    }

    await db
      .delete(CollectionGameTable)
      .where(
        and(
          eq(CollectionGameTable.collectionId, sourceCollectionId),
          eq(CollectionGameTable.gameId, gameId),
        ),
      )

    const exists = await db
      .select({ id: CollectionGameTable.id })
      .from(CollectionGameTable)
      .where(
        and(
          eq(CollectionGameTable.collectionId, targetCollectionId),
          eq(CollectionGameTable.gameId, gameId),
        ),
      )
      .limit(1)

    if (!exists[0]) {
      await db.insert(CollectionGameTable).values({
        collectionId: targetCollectionId,
        gameId,
      })
    }

    const now = dayjs().toISOString()
    await db
      .update(CollectionTable)
      .set({ updatedAt: now })
      .where(eq(CollectionTable.id, sourceCollectionId))
    await db
      .update(CollectionTable)
      .set({ updatedAt: now })
      .where(eq(CollectionTable.id, targetCollectionId))

    return NextResponse.json({
      data: {
        gameId,
        sourceCollectionId,
        targetCollectionId,
        moved: true,
      },
    })
  } catch (error) {
    console.error('Move game to other collection failed:', error)
    return NextResponse.json(
      { error: 'Failed to move game to other collection' },
      { status: 500 },
    )
  }
}

export {
  addGameToCollection as POST,
  removeGameFromCollection as DELETE,
  moveGameToOtherCollection as PATCH,
}
