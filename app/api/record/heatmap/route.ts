import dayjs from 'dayjs'
import { NextRequest, NextResponse } from 'next/server'

import { GameRecordTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

const DEFAULT_DAYS = 365
const MIN_DAYS = 30
const MAX_DAYS = 400

const parseDays = (value: string | null) => {
  const n = Number(value)
  if (!Number.isFinite(n)) {
    return DEFAULT_DAYS
  }
  return Math.min(MAX_DAYS, Math.max(MIN_DAYS, Math.floor(n)))
}

const getPlayHeatmap = async (req: NextRequest) => {
  try {
    const days = parseDays(req.nextUrl.searchParams.get('days'))
    const end = dayjs().startOf('day')
    const start = end.subtract(days - 1, 'day')

    const rows = await db
      .select({
        playDate: GameRecordTable.playDate,
        playTime: GameRecordTable.playTime,
      })
      .from(GameRecordTable)

    const bucket = new Map<string, number>()

    for (const row of rows) {
      const date = dayjs(row.playDate || '')
      if (!date.isValid() || date.isBefore(start, 'day') || date.isAfter(end, 'day')) {
        continue
      }

      const key = date.format('YYYY-MM-DD')
      const seconds = Math.max(0, Number(row.playTime || 0))
      bucket.set(key, (bucket.get(key) || 0) + seconds)
    }

    const points: Array<{ date: string; seconds: number; hours: number }> = []

    let cursor = start
    while (cursor.isBefore(end, 'day') || cursor.isSame(end, 'day')) {
      const key = cursor.format('YYYY-MM-DD')
      const seconds = bucket.get(key) || 0
      points.push({
        date: key,
        seconds,
        hours: Number((seconds / 3600).toFixed(2)),
      })
      cursor = cursor.add(1, 'day')
    }

    const totalSeconds = points.reduce((sum, point) => sum + point.seconds, 0)
    const activeDays = points.filter((point) => point.seconds > 0).length

    return NextResponse.json({
      data: {
        startDate: start.format('YYYY-MM-DD'),
        endDate: end.format('YYYY-MM-DD'),
        days: points,
        totalSeconds,
        totalHours: Number((totalSeconds / 3600).toFixed(2)),
        activeDays,
      },
    })
  } catch (error) {
    console.error('Get play heatmap failed:', error)
    return NextResponse.json({ error: 'Failed to fetch play heatmap' }, { status: 500 })
  }
}

export { getPlayHeatmap as GET }
