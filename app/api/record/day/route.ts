import dayjs from 'dayjs'
import { and, eq, gte, lt } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { GameInfoTable, GameRecordTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

import type { RecordDayGame } from '@/types'

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get('date') ?? ''
  const day = dayjs(date)
  if (!day.isValid() || day.format('YYYY-MM-DD') !== date) {
    return NextResponse.json({ error: '日期格式无效' }, { status: 400 })
  }

  try {
    const includeNsfw = request.nextUrl.searchParams.get('includeNsfw') === 'true'
    const rows = await db
      .select({
        gameId: GameInfoTable.id,
        name: GameInfoTable.name,
        nameCn: GameInfoTable.nameCn,
        playDate: GameRecordTable.playDate,
        playTime: GameRecordTable.playTime,
      })
      .from(GameRecordTable)
      .innerJoin(GameInfoTable, eq(GameRecordTable.gameId, GameInfoTable.id))
      .where(
        and(
          // 记录可能以本地日期或 ISO 时间戳保存，先取相邻日期，再按热力图的本地日期归组。
          gte(GameRecordTable.playDate, day.subtract(1, 'day').format('YYYY-MM-DD')),
          lt(GameRecordTable.playDate, day.add(2, 'day').format('YYYY-MM-DD')),
          includeNsfw ? undefined : eq(GameInfoTable.nsfw, 0),
        ),
      )

    const games = new Map<number, RecordDayGame>()
    for (const row of rows) {
      if (!row.playDate || dayjs(row.playDate).format('YYYY-MM-DD') !== date) continue
      const game = games.get(row.gameId) ?? {
        gameId: row.gameId,
        title: row.nameCn || row.name || `游戏 ${row.gameId}`,
        seconds: 0,
        recordCount: 0,
      }
      game.seconds += Math.max(0, Number(row.playTime) || 0)
      game.recordCount++
      games.set(row.gameId, game)
    }

    return NextResponse.json({ data: [...games.values()].sort((a, b) => b.seconds - a.seconds) })
  } catch (error) {
    console.error('Get daily play records failed:', error)
    return NextResponse.json({ error: '游玩记录加载失败' }, { status: 500 })
  }
}
