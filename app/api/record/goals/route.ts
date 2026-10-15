import dayjs from 'dayjs'
import { NextResponse } from 'next/server'

import { GamePlayTable, GameRecordTable } from '@/db/schema'
import { db } from '@/lib/drizzle'
import { ensureGameCompletionSchema, isCompletedStatus } from '@/lib/server/game-completion'

// 目标进度：今日游玩时长 + 今年完成游戏数
async function getGoalProgress() {
  try {
    await ensureGameCompletionSchema()

    const today = dayjs().startOf('day')
    const todayKey = today.format('YYYY-MM-DD')
    const currentYear = today.year()

    const records = await db
      .select({
        playDate: GameRecordTable.playDate,
        playTime: GameRecordTable.playTime,
      })
      .from(GameRecordTable)

    let todaySeconds = 0
    for (const record of records) {
      const date = dayjs(record.playDate || '')
      if (!date.isValid() || date.format('YYYY-MM-DD') !== todayKey) {
        continue
      }
      todaySeconds += Math.max(0, Number(record.playTime || 0))
    }

    const plays = await db
      .select({
        status: GamePlayTable.status,
        completedAt: GamePlayTable.completedAt,
      })
      .from(GamePlayTable)

    let completedThisYear = 0
    for (const play of plays) {
      if (!isCompletedStatus(Number(play.status ?? 0))) {
        continue
      }
      const completedAt = dayjs(play.completedAt || '')
      if (completedAt.isValid() && completedAt.year() === currentYear) {
        completedThisYear += 1
      }
    }

    return NextResponse.json({
      data: {
        date: todayKey,
        year: currentYear,
        todaySeconds,
        completedThisYear,
      },
    })
  } catch (error) {
    console.error('Get goal progress failed:', error)
    return NextResponse.json({ error: 'Failed to fetch goal progress' }, { status: 500 })
  }
}

export { getGoalProgress as GET }
