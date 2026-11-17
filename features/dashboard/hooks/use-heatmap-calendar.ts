import dayjs from 'dayjs'
import { useMemo } from 'react'

import { buildMonthCells, getHeatmapThresholds } from '../lib/heatmap-utils'

import type { RecordHeatmapPeriod, RecordPlayHeatmapMonth } from '@/types'

type HeatmapCalendarOptions = {
  data?: RecordPlayHeatmapMonth
  periods: RecordHeatmapPeriod[]
  period: { year: number; month: number } | null
  onSelectPeriod: (year: number, month: number) => void
}

export function useHeatmapCalendar({
  data,
  periods,
  period,
  onSelectPeriod,
}: HeatmapCalendarOptions) {
  const cells = useMemo(() => buildMonthCells(data?.days ?? []), [data])
  const thresholds = useMemo(() => getHeatmapThresholds(data?.days ?? []), [data])
  const months = periods.find((item) => item.year === period?.year)?.months ?? []

  return {
    cells,
    thresholds,
    months,
    todayKey: dayjs().format('YYYY-MM-DD'),
    selectYear: (value: string) => {
      if (!period) return
      const year = Number(value)
      const nextMonths = periods.find((item) => item.year === year)?.months ?? []
      const month = nextMonths.includes(period.month) ? period.month : nextMonths.at(-1)
      if (month !== undefined) onSelectPeriod(year, month)
    },
    selectMonth: (value: string) => {
      if (period) onSelectPeriod(period.year, Number(value))
    },
  }
}
