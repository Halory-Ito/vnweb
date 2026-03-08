import dayjs from 'dayjs'
import { NextRequest, NextResponse } from 'next/server'

import { GameRecordTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

type RangeType = 'week' | 'month' | 'year'

type Point = {
  key: string
  label: string
  seconds: number
  hours: number
}

const parseRange = (value: string | null): RangeType => {
  if (value === 'month' || value === 'year') {
    return value
  }
  return 'week'
}

const parseOffset = (value: string | null): number => {
  const n = Number(value)
  if (!Number.isInteger(n)) {
    return 0
  }
  return Math.min(0, n)
}

const getPeriod = (range: RangeType, offset: number) => {
  const now = dayjs()

  if (range === 'week') {
    const start = now.add(offset, 'week').startOf('week')
    const end = start.endOf('week')
    return {
      start,
      end,
      label: `${start.format('YYYY-MM-DD')} ~ ${end.format('YYYY-MM-DD')}`,
    }
  }

  if (range === 'month') {
    const start = now.add(offset, 'month').startOf('month')
    const end = start.endOf('month')
    return {
      start,
      end,
      label: `${start.format('YYYY年MM月')}`,
    }
  }

  const start = now.add(offset, 'year').startOf('year')
  const end = start.endOf('year')
  return {
    start,
    end,
    label: `${start.format('YYYY年')}`,
  }
}

const toHours = (seconds: number) => Number((seconds / 3600).toFixed(2))

const getTimeline = async (req: NextRequest) => {
  try {
    const range = parseRange(req.nextUrl.searchParams.get('range'))
    const offset = parseOffset(req.nextUrl.searchParams.get('offset'))
    const { start, end, label } = getPeriod(range, offset)

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
      if (date.isBefore(start) || date.isAfter(end)) {
        continue
      }

      const key =
        range === 'year' ? date.format('YYYY-MM') : date.format('YYYY-MM-DD')
      const seconds = Math.max(0, Number(row.playTime || 0))
      bucket.set(key, (bucket.get(key) || 0) + seconds)
    }

    const points: Point[] = []

    if (range === 'year') {
      let cursor = start.startOf('month')
      const last = end.endOf('month')
      while (cursor.isBefore(last) || cursor.isSame(last, 'month')) {
        const key = cursor.format('YYYY-MM')
        const seconds = bucket.get(key) || 0
        points.push({
          key,
          label: cursor.format('M月'),
          seconds,
          hours: toHours(seconds),
        })
        cursor = cursor.add(1, 'month')
      }
    } else {
      let cursor = start.startOf('day')
      const last = end.endOf('day')
      while (cursor.isBefore(last) || cursor.isSame(last, 'day')) {
        const key = cursor.format('YYYY-MM-DD')
        const seconds = bucket.get(key) || 0
        points.push({
          key,
          label: cursor.format('MM-DD'),
          seconds,
          hours: toHours(seconds),
        })
        cursor = cursor.add(1, 'day')
      }
    }

    const totalSeconds = points.reduce((sum, p) => sum + p.seconds, 0)
    const activePoints = points.filter((p) => p.seconds > 0)

    const peakPoint = points.reduce<Point | null>((max, p) => {
      if (max === null || p.seconds > max.seconds) {
        return p
      }
      return max
    }, null)

    return NextResponse.json({
      data: {
        range,
        offset,
        periodLabel: label,
        points,
        totalSeconds,
        totalHours: toHours(totalSeconds),
        activeCount: activePoints.length,
        peakLabel: peakPoint?.label || '-',
        peakSeconds: peakPoint?.seconds || 0,
      },
    })
  } catch (error) {
    console.error('Get record timeline failed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch timeline' },
      { status: 500 },
    )
  }
}

export { getTimeline as GET }
