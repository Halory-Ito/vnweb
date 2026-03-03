import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { GamePlayTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

const getRuntime = async (
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await context.params
    const gameId = Number(id)

    if (!Number.isInteger(gameId) || gameId <= 0) {
      return NextResponse.json({ error: 'Invalid game id' }, { status: 400 })
    }

    const playRows = await db
      .select({
        isRunning: GamePlayTable.isRunning,
        lastLaunchedAt: GamePlayTable.lastLaunchedAt,
      })
      .from(GamePlayTable)
      .where(eq(GamePlayTable.gameId, gameId))
      .limit(1)

    const play = playRows[0]
    if (!play || play.isRunning !== 1) {
      return NextResponse.json({
        data: {
          isRunning: false,
          currentSessionSeconds: 0,
        },
      })
    }

    const currentSessionSeconds = play.lastLaunchedAt
      ? Math.max(
          0,
          Math.floor((Date.now() - new Date(play.lastLaunchedAt).getTime()) / 1000),
        )
      : 0

    return NextResponse.json({
      data: {
        isRunning: true,
        currentSessionSeconds,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to query runtime' },
      { status: 500 },
    )
  }
}

export { getRuntime as GET }
