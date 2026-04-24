import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { GameInfoTable, GamePvTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

const normalizeText = (value: unknown) => {
  if (typeof value !== 'string') {
    return ''
  }
  return value.trim()
}

const parsePvId = async (context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params
  const pvId = Number(id)

  if (!Number.isInteger(pvId) || pvId <= 0) {
    throw new Error('INVALID_PV_ID')
  }

  return pvId
}

const updatePv = async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  try {
    const pvId = await parsePvId(context)
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

    const target = await db
      .select({ id: GamePvTable.id })
      .from(GamePvTable)
      .where(eq(GamePvTable.id, pvId))
      .limit(1)

    if (!target[0]) {
      return NextResponse.json({ error: 'PV 不存在' }, { status: 404 })
    }

    await db
      .update(GamePvTable)
      .set({
        gameId,
        name,
        url,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(GamePvTable.id, pvId))

    return NextResponse.json({
      data: {
        updated: true,
        id: pvId,
      },
    })
  } catch (error) {
    if ((error as Error).message === 'INVALID_PV_ID') {
      return NextResponse.json({ error: '无效的 PV id' }, { status: 400 })
    }

    console.error('Update pv failed:', error)
    return NextResponse.json({ error: 'Failed to update pv' }, { status: 500 })
  }
}

const deletePv = async (
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  try {
    const pvId = await parsePvId(context)

    const target = await db
      .select({ id: GamePvTable.id })
      .from(GamePvTable)
      .where(eq(GamePvTable.id, pvId))
      .limit(1)

    if (!target[0]) {
      return NextResponse.json({ error: 'PV 不存在' }, { status: 404 })
    }

    await db.delete(GamePvTable).where(eq(GamePvTable.id, pvId))

    return NextResponse.json({
      data: {
        deleted: true,
        id: pvId,
      },
    })
  } catch (error) {
    if ((error as Error).message === 'INVALID_PV_ID') {
      return NextResponse.json({ error: '无效的 PV id' }, { status: 400 })
    }

    console.error('Delete pv failed:', error)
    return NextResponse.json({ error: 'Failed to delete pv' }, { status: 500 })
  }
}

export { updatePv as PATCH, deletePv as DELETE }
