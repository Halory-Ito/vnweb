import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useAtomValue } from 'jotai'
import { useState } from 'react'

import { buildMonthCells, getHeatmapThresholds } from '../lib/heatmap-utils'
import { getRecordDayGames } from '@/api/record'
import { showNsfwAtom } from '@/atom/global'

import type { RecordPlayHeatmapDay } from '@/types'

export function usePlayCalendar(year: number, days: RecordPlayHeatmapDay[]) {
  const showNsfw = useAtomValue(showNsfwAtom)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const today = dayjs()
  const todayKey = today.format('YYYY-MM-DD')
  const date =
    selectedDate ??
    (year === today.year()
      ? todayKey
      : (days.findLast((day) => day.seconds > 0)?.date ?? `${year}-01-01`))
  const month = Number(date.slice(5, 7))
  const monthDays = days.filter((day) => Number(day.date.slice(5, 7)) === month)

  const records = useQuery({
    queryKey: ['record-day', date, showNsfw],
    queryFn: () => getRecordDayGames(date, showNsfw),
    enabled: days.length > 0,
    staleTime: 60_000,
  })

  function selectMonth(value: number) {
    const first = dayjs(`${year}-01-01`).month(value - 1)
    setSelectedDate(first.isSame(today, 'month') ? todayKey : first.format('YYYY-MM-DD'))
  }

  return {
    date,
    month,
    todayKey,
    setSelectedDate,
    selectMonth,
    cells: buildMonthCells(monthDays),
    thresholds: getHeatmapThresholds(days),
    records,
  }
}
