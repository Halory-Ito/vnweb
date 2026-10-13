import dayjs from 'dayjs'
import { NextResponse } from 'next/server'

import { GameRecordTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

const getHeatmapPeriods = async () => {
  try {
    const rows = await db
      .selectDistinct({ playDate: GameRecordTable.playDate })
      .from(GameRecordTable)

    const yearMap = new Map<number, Set<number>>()

    for (const row of rows) {
      const date = dayjs(row.playDate || '')
      if (!date.isValid()) {
        continue
      }

      const year = date.year()
      if (!yearMap.has(year)) {
        yearMap.set(year, new Set())
      }
      yearMap.get(year)?.add(date.month() + 1)
    }

    const periods = Array.from(yearMap.entries())
      .map(([year, months]) => ({
        year,
        months: Array.from(months).sort((a, b) => a - b),
      }))
      .sort((a, b) => b.year - a.year)

    const latestYear = periods[0]
    const latest = latestYear
      ? { year: latestYear.year, month: latestYear.months[latestYear.months.length - 1] }
      : null

    return NextResponse.json({ data: { periods, latest } })
  } catch (error) {
    console.error('Get heatmap periods failed:', error)
    return NextResponse.json({ error: 'Failed to fetch heatmap periods' }, { status: 500 })
  }
}

export { getHeatmapPeriods as GET }
