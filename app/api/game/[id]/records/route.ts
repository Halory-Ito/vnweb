import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { GameInfoTable, GamePlayTable, GameRecordTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

type RecordPayloadItem = {
  startAt?: string
  endAt?: string
}

const toRecordView = (record: {
  id: number
  playDate: string | null
  playTime: number | null
}) => {
  const rawStart = record.playDate || ''
  const startDate = new Date(rawStart)
  const isValidStart = !Number.isNaN(startDate.getTime())
  const safeStartDate = isValidStart ? startDate : new Date(0)
  const durationSeconds = Math.max(0, Number(record.playTime || 0))
  const endDate = new Date(safeStartDate.getTime() + durationSeconds * 1000)

  return {
    id: record.id,
    startAt: safeStartDate.toISOString(),
    endAt: endDate.toISOString(),
    durationSeconds,
  }
}

const getRecords = async (
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await context.params
    const gameId = Number(id)

    if (!Number.isInteger(gameId) || gameId <= 0) {
      return NextResponse.json({ error: 'Invalid game id' }, { status: 400 })
    }

    const gameRows = await db
      .select({ id: GameInfoTable.id })
      .from(GameInfoTable)
      .where(eq(GameInfoTable.id, gameId))
      .limit(1)

    if (!gameRows[0]) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    const recordRows = await db
      .select({
        id: GameRecordTable.id,
        playDate: GameRecordTable.playDate,
        playTime: GameRecordTable.playTime,
      })
      .from(GameRecordTable)
      .where(eq(GameRecordTable.gameId, gameId))

    const records = recordRows.map(toRecordView)
    const totalPlayTime = records.reduce(
      (sum, item) => sum + item.durationSeconds,
      0,
    )

    return NextResponse.json({
      data: {
        records,
        totalPlayTime,
      },
    })
  } catch (error) {
    console.error('Get game records failed:', error)
    return NextResponse.json(
      { error: 'Failed to query game records' },
      { status: 500 },
    )
  }
}

const updateRecords = async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await context.params
    const gameId = Number(id)

    if (!Number.isInteger(gameId) || gameId <= 0) {
      return NextResponse.json({ error: 'Invalid game id' }, { status: 400 })
    }

    const gameRows = await db
      .select({ id: GameInfoTable.id })
      .from(GameInfoTable)
      .where(eq(GameInfoTable.id, gameId))
      .limit(1)

    if (!gameRows[0]) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    const payload = (await req.json().catch(() => ({}))) as {
      records?: RecordPayloadItem[]
    }

    const nextRecords = Array.isArray(payload.records) ? payload.records : []

    const normalized = nextRecords.map((item, index) => {
      const startDate = new Date(item.startAt || '')
      const endDate = new Date(item.endAt || '')

      if (
        Number.isNaN(startDate.getTime()) ||
        Number.isNaN(endDate.getTime()) ||
        endDate.getTime() < startDate.getTime()
      ) {
        throw new Error(`Invalid record at index ${index}`)
      }

      return {
        playDate: startDate.toISOString(),
        playTime: Math.floor((endDate.getTime() - startDate.getTime()) / 1000),
      }
    })

    const totalPlayTime = normalized.reduce(
      (sum, item) => sum + item.playTime,
      0,
    )

    await db.delete(GameRecordTable).where(eq(GameRecordTable.gameId, gameId))

    if (normalized.length > 0) {
      await db.insert(GameRecordTable).values(
        normalized.map((item) => ({
          gameId,
          playDate: item.playDate,
          playTime: item.playTime,
        })),
      )
    }

    const playRows = await db
      .select({ id: GamePlayTable.id })
      .from(GamePlayTable)
      .where(eq(GamePlayTable.gameId, gameId))
      .limit(1)

    const play = playRows[0]
    if (play) {
      await db
        .update(GamePlayTable)
        .set({
          totalPlayTime,
        })
        .where(eq(GamePlayTable.id, play.id))
    } else {
      await db.insert(GamePlayTable).values({
        gameId,
        totalPlayTime,
      })
    }

    return NextResponse.json({
      data: {
        updated: true,
        totalPlayTime,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to update game records' },
      { status: 500 },
    )
  }
}

export { getRecords as GET, updateRecords as PUT }
