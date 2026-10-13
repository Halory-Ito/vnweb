import dayjs from 'dayjs'
import { NextRequest, NextResponse } from 'next/server'

import { GameRecordTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

const parseNumber = (value: string | null) => {
  const n = Number(value)
  return Number.isFinite(n) ? Math.floor(n) : null
}

const resolveTargetMonth = (year: number | null, month: number | null, latestKey: string) => {
  if (year !== null && month !== null && year >= 1970 && month >= 1 && month <= 12) {
    return dayjs(`${year}-${String(month).padStart(2, '0')}-01`)
  }

  if (latestKey) {
    return dayjs(latestKey)
  }

  return dayjs().startOf('month')
}

const getHeatmapMonth = async (req: NextRequest) => {
  try {
    const yearParam = parseNumber(req.nextUrl.searchParams.get('year'))
    const monthParam = parseNumber(req.nextUrl.searchParams.get('month'))

    const rows = await db
      .select({
        playDate: GameRecordTable.playDate,
        playTime: GameRecordTable.playTime,
      })
      .from(GameRecordTable)

    const bucket = new Map<string, number>()

    for (const row of rows) {
      const date = dayjs(row.playDate || '')
      if (!date.isValid()) {
        continue
      }

      const key = date.format('YYYY-MM-DD')
      const seconds = Math.max(0, Number(row.playTime || 0))
      bucket.set(key, (bucket.get(key) || 0) + seconds)
    }

    const latestKey = Array.from(bucket.keys()).sort().at(-1)
    const target = resolveTargetMonth(yearParam, monthParam, latestKey || '')
    const daysInMonth = target.daysInMonth()

    const days: Array<{ date: string; seconds: number; hours: number }> = []
    for (let day = 1; day <= daysInMonth; day += 1) {
      const key = target.date(day).format('YYYY-MM-DD')
      const seconds = bucket.get(key) || 0
      days.push({
        date: key,
        seconds,
        hours: Number((seconds / 3600).toFixed(2)),
      })
    }

    const totalSeconds = days.reduce((sum, day) => sum + day.seconds, 0)
    const activeDays = days.filter((day) => day.seconds > 0).length

    return NextResponse.json({
      data: {
        year: target.year(),
        month: target.month() + 1,
        days,
        totalSeconds,
        totalHours: Number((totalSeconds / 3600).toFixed(2)),
        activeDays,
      },
    })
  } catch (error) {
    console.error('Get heatmap month failed:', error)
    return NextResponse.json({ error: 'Failed to fetch heatmap month' }, { status: 500 })
  }
}

export { getHeatmapMonth as GET }
