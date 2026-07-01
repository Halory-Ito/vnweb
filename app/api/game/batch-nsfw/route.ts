import { inArray } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { GameInfoTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { gameIds, nsfw } = body as {
      gameIds: string[]
      nsfw: boolean
    }

    if (!Array.isArray(gameIds) || gameIds.length === 0) {
      return NextResponse.json({ error: '请选择至少一个游戏' }, { status: 400 })
    }

    if (typeof nsfw !== 'boolean') {
      return NextResponse.json({ error: '请指定 NSFW 状态' }, { status: 400 })
    }

    const numericIds = gameIds
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0)

    if (numericIds.length === 0) {
      return NextResponse.json({ error: '无效的游戏 ID' }, { status: 400 })
    }

    await db
      .update(GameInfoTable)
      .set({ nsfw: nsfw ? 1 : 0 })
      .where(inArray(GameInfoTable.id, numericIds))

    return NextResponse.json({
      data: {
        success: true,
        updatedCount: numericIds.length,
      },
    })
  } catch (error) {
    console.error('Batch update NSFW failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '批量更新 NSFW 状态失败' },
      { status: 500 },
    )
  }
}
