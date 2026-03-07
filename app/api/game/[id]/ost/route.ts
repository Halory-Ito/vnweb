import { and, desc, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { GameInfoTable, GameOstTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

const normalizeText = (value: unknown) => {
  if (typeof value !== 'string') {
    return ''
  }
  return value.trim()
}

const parseGameId = async (context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params
  const gameId = Number(id)
  if (!Number.isInteger(gameId) || gameId <= 0) {
    throw new Error('Invalid game id')
  }
  return gameId
}

const ensureGameExists = async (gameId: number) => {
  const rows = await db
    .select({ id: GameInfoTable.id })
    .from(GameInfoTable)
    .where(eq(GameInfoTable.id, gameId))
    .limit(1)

  if (!rows[0]) {
    throw new Error('Game not found')
  }
}

const getOsts = async (
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  try {
    const gameId = await parseGameId(context)
    await ensureGameExists(gameId)

    const rows = await db
      .select({
        id: GameOstTable.id,
        name: GameOstTable.name,
        url: GameOstTable.url,
        createdAt: GameOstTable.createdAt,
        updatedAt: GameOstTable.updatedAt,
      })
      .from(GameOstTable)
      .where(eq(GameOstTable.gameId, gameId))
      .orderBy(desc(GameOstTable.id))

    return NextResponse.json({
      data: {
        items: rows,
      },
    })
  } catch (error) {
    const message = (error as Error).message || 'Failed to query game ost'
    if (message === 'Invalid game id') {
      return NextResponse.json({ error: message }, { status: 400 })
    }
    if (message === 'Game not found') {
      return NextResponse.json({ error: message }, { status: 404 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

const createOst = async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  try {
    const gameId = await parseGameId(context)
    await ensureGameExists(gameId)

    const payload = (await req.json().catch(() => ({}))) as {
      name?: string
      url?: string
    }

    const name = normalizeText(payload.name)
    const url = normalizeText(payload.url)

    if (!name || !url) {
      return NextResponse.json(
        { error: 'name and url are required' },
        { status: 400 },
      )
    }

    const now = new Date().toISOString()
    const result = await db
      .insert(GameOstTable)
      .values({
        gameId,
        name,
        url,
        createdAt: now,
        updatedAt: now,
      })
      .returning({
        id: GameOstTable.id,
        name: GameOstTable.name,
        url: GameOstTable.url,
        createdAt: GameOstTable.createdAt,
        updatedAt: GameOstTable.updatedAt,
      })

    return NextResponse.json({
      data: {
        item: result[0],
      },
    })
  } catch (error) {
    const message = (error as Error).message || 'Failed to create game ost'
    if (message === 'Invalid game id') {
      return NextResponse.json({ error: message }, { status: 400 })
    }
    if (message === 'Game not found') {
      return NextResponse.json({ error: message }, { status: 404 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

const updateOst = async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  try {
    const gameId = await parseGameId(context)
    await ensureGameExists(gameId)

    const payload = (await req.json().catch(() => ({}))) as {
      itemId?: number
      name?: string
      url?: string
    }

    const itemId = Number(payload.itemId)
    const name = normalizeText(payload.name)
    const url = normalizeText(payload.url)

    if (!Number.isInteger(itemId) || itemId <= 0 || !name || !url) {
      return NextResponse.json(
        { error: 'itemId, name and url are required' },
        { status: 400 },
      )
    }

    const now = new Date().toISOString()
    const result = await db
      .update(GameOstTable)
      .set({
        name,
        url,
        updatedAt: now,
      })
      .where(and(eq(GameOstTable.id, itemId), eq(GameOstTable.gameId, gameId)))
      .returning({
        id: GameOstTable.id,
        name: GameOstTable.name,
        url: GameOstTable.url,
        createdAt: GameOstTable.createdAt,
        updatedAt: GameOstTable.updatedAt,
      })

    if (!result[0]) {
      return NextResponse.json({ error: 'OST item not found' }, { status: 404 })
    }

    return NextResponse.json({
      data: {
        item: result[0],
      },
    })
  } catch (error) {
    const message = (error as Error).message || 'Failed to update game ost'
    if (message === 'Invalid game id') {
      return NextResponse.json({ error: message }, { status: 400 })
    }
    if (message === 'Game not found') {
      return NextResponse.json({ error: message }, { status: 404 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

const deleteOst = async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  try {
    const gameId = await parseGameId(context)
    await ensureGameExists(gameId)

    const itemId = Number(req.nextUrl.searchParams.get('itemId') || '')
    if (!Number.isInteger(itemId) || itemId <= 0) {
      return NextResponse.json({ error: 'itemId is required' }, { status: 400 })
    }

    const result = await db
      .delete(GameOstTable)
      .where(and(eq(GameOstTable.id, itemId), eq(GameOstTable.gameId, gameId)))
      .returning({ id: GameOstTable.id })

    if (!result[0]) {
      return NextResponse.json({ error: 'OST item not found' }, { status: 404 })
    }

    return NextResponse.json({
      data: {
        deleted: true,
        itemId,
      },
    })
  } catch (error) {
    const message = (error as Error).message || 'Failed to delete game ost'
    if (message === 'Invalid game id') {
      return NextResponse.json({ error: message }, { status: 400 })
    }
    if (message === 'Game not found') {
      return NextResponse.json({ error: message }, { status: 404 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export {
  getOsts as GET,
  createOst as POST,
  updateOst as PATCH,
  deleteOst as DELETE,
}
