import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { GameInfoTable, GameOstSongsTable, GameOstTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

const normalizeText = (value: unknown) => {
  if (typeof value !== 'string') {
    return ''
  }
  return value.trim()
}

const updateOst = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params
    const ostId = Number(id)

    if (!Number.isInteger(ostId) || ostId <= 0) {
      return NextResponse.json({ error: '无效的 OST id' }, { status: 400 })
    }

    const payload = (await req.json().catch(() => ({}))) as {
      gameId?: number
      name?: string
      cover?: string
      resource?: string
    }

    const gameId = Number(payload.gameId)
    const name = normalizeText(payload.name)
    const cover = normalizeText(payload.cover)
    const resource = normalizeText(payload.resource || 'khinsider')

    if (!Number.isInteger(gameId) || gameId <= 0) {
      return NextResponse.json({ error: '无效的游戏 id' }, { status: 400 })
    }

    if (!name || !cover) {
      return NextResponse.json(
        { error: 'OST名称和封面不能为空' },
        { status: 400 },
      )
    }

    // 检查 OST 是否存在
    const existing = await db
      .select({ id: GameOstTable.id })
      .from(GameOstTable)
      .where(eq(GameOstTable.id, ostId))
      .limit(1)

    if (!existing[0]) {
      return NextResponse.json({ error: 'OST 不存在' }, { status: 404 })
    }

    // 检查游戏是否存在
    const game = await db
      .select({ id: GameInfoTable.id })
      .from(GameInfoTable)
      .where(eq(GameInfoTable.id, gameId))
      .limit(1)

    if (!game[0]) {
      return NextResponse.json({ error: '游戏不存在' }, { status: 404 })
    }

    const now = new Date().toISOString()
    await db
      .update(GameOstTable)
      .set({
        gameId,
        name,
        cover,
        resource,
        updatedAt: now,
      })
      .where(eq(GameOstTable.id, ostId))

    return NextResponse.json({
      data: {
        updated: true,
        id: ostId,
      },
    })
  } catch (error) {
    console.error('Update ost failed:', error)
    return NextResponse.json({ error: 'Failed to update ost' }, { status: 500 })
  }
}

const deleteOst = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params
    const ostId = Number(id)

    if (!Number.isInteger(ostId) || ostId <= 0) {
      return NextResponse.json({ error: '无效的 OST id' }, { status: 400 })
    }

    // 检查 OST 是否存在
    const existing = await db
      .select({ id: GameOstTable.id })
      .from(GameOstTable)
      .where(eq(GameOstTable.id, ostId))
      .limit(1)

    if (!existing[0]) {
      return NextResponse.json({ error: 'OST 不存在' }, { status: 404 })
    }

    await db.delete(GameOstTable).where(eq(GameOstTable.id, ostId))

    // 删除歌曲
    await db.delete(GameOstSongsTable).where(eq(GameOstSongsTable.ostId, ostId))

    return NextResponse.json({
      data: {
        deleted: true,
        id: ostId,
      },
    })
  } catch (error) {
    console.error('Delete ost failed:', error)
    return NextResponse.json({ error: 'Failed to delete ost' }, { status: 500 })
  }
}

const getOst = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params
    const ostId = Number(id)

    if (!Number.isInteger(ostId) || ostId <= 0) {
      return NextResponse.json({ error: '无效的 OST id' }, { status: 400 })
    }

    const result = await db
      .select({
        id: GameOstTable.id,
        gameId: GameOstTable.gameId,
        name: GameOstTable.name,
        cover: GameOstTable.cover,
        resource: GameOstTable.resource,
        createdAt: GameOstTable.createdAt,
        updatedAt: GameOstTable.updatedAt,
      })
      .from(GameOstTable)
      .where(eq(GameOstTable.id, ostId))
      .limit(1)

    if (!result[0]) {
      return NextResponse.json({ error: 'OST 不存在' }, { status: 404 })
    }

    return NextResponse.json({
      data: {
        item: result[0],
      },
    })
  } catch (error) {
    console.error('Get ost failed:', error)
    return NextResponse.json({ error: 'Failed to get ost' }, { status: 500 })
  }
}

export { updateOst as PATCH, deleteOst as DELETE, getOst as GET }
