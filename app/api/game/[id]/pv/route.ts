import { and, desc, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { GameInfoTable, GamePvTable } from '@/db/schema'
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

const getPvs = async (
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  try {
    const gameId = await parseGameId(context)
    await ensureGameExists(gameId)

    const rows = await db
      .select({
        id: GamePvTable.id,
        name: GamePvTable.name,
        url: GamePvTable.url,
        createdAt: GamePvTable.createdAt,
        updatedAt: GamePvTable.updatedAt,
      })
      .from(GamePvTable)
      .where(eq(GamePvTable.gameId, gameId))
      .orderBy(desc(GamePvTable.id))

    return NextResponse.json({
      data: {
        items: rows,
      },
    })
  } catch (error) {
    const message = (error as Error).message || 'Failed to query game pv'
    if (message === 'Invalid game id') {
      return NextResponse.json({ error: message }, { status: 400 })
    }
    if (message === 'Game not found') {
      return NextResponse.json({ error: message }, { status: 404 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

const createPv = async (
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
        name: GamePvTable.name,
        url: GamePvTable.url,
        createdAt: GamePvTable.createdAt,
        updatedAt: GamePvTable.updatedAt,
      })

    return NextResponse.json({
      data: {
        item: result[0],
      },
    })
  } catch (error) {
    const message = (error as Error).message || 'Failed to create game pv'
    if (message === 'Invalid game id') {
      return NextResponse.json({ error: message }, { status: 400 })
    }
    if (message === 'Game not found') {
      return NextResponse.json({ error: message }, { status: 404 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

const updatePv = async (
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
      .update(GamePvTable)
      .set({
        name,
        url,
        updatedAt: now,
      })
      .where(and(eq(GamePvTable.id, itemId), eq(GamePvTable.gameId, gameId)))
      .returning({
        id: GamePvTable.id,
        name: GamePvTable.name,
        url: GamePvTable.url,
        createdAt: GamePvTable.createdAt,
        updatedAt: GamePvTable.updatedAt,
      })

    if (!result[0]) {
      return NextResponse.json({ error: 'PV item not found' }, { status: 404 })
    }

    return NextResponse.json({
      data: {
        item: result[0],
      },
    })
  } catch (error) {
    const message = (error as Error).message || 'Failed to update game pv'
    if (message === 'Invalid game id') {
      return NextResponse.json({ error: message }, { status: 400 })
    }
    if (message === 'Game not found') {
      return NextResponse.json({ error: message }, { status: 404 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

const deletePv = async (
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
      .delete(GamePvTable)
      .where(and(eq(GamePvTable.id, itemId), eq(GamePvTable.gameId, gameId)))
      .returning({ id: GamePvTable.id })

    if (!result[0]) {
      return NextResponse.json({ error: 'PV item not found' }, { status: 404 })
    }

    return NextResponse.json({
      data: {
        deleted: true,
        itemId,
      },
    })
  } catch (error) {
    const message = (error as Error).message || 'Failed to delete game pv'
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
  getPvs as GET,
  createPv as POST,
  updatePv as PATCH,
  deletePv as DELETE,
}
