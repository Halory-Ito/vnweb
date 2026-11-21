'use client'

import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'

import { calcCurrentStreak } from '../lib/heatmap-utils'
import { getPlayHeatmapApi, getPlayHeatmapPeriodsApi, getPlayHeatmapYearApi } from '@/api'

const HEATMAP_DAYS = 365

export function usePlayHeatmap() {
  // 近一年数据：用于「近 7 天游玩」「连续游玩」统计
  const overviewQuery = useQuery({
    queryKey: ['play-heatmap', HEATMAP_DAYS],
    queryFn: () => getPlayHeatmapApi(HEATMAP_DAYS),
    staleTime: 60_000,
  })

  // 可切换的年月列表
  const periodsQuery = useQuery({
    queryKey: ['play-heatmap-periods'],
    queryFn: getPlayHeatmapPeriodsApi,
    staleTime: 60_000,
  })

  const currentYear = dayjs().year()
  const recordedPeriods = periodsQuery.data?.periods ?? []
  const periods = recordedPeriods.some((period) => period.year === currentYear)
    ? recordedPeriods
    : [{ year: currentYear, months: [] }, ...recordedPeriods]
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const activeYear = selectedYear ?? currentYear

  const yearQuery = useQuery({
    queryKey: ['play-heatmap-year', activeYear],
    queryFn: () => getPlayHeatmapYearApi(activeYear),
    staleTime: 60_000,
  })

  const overviewDays = useMemo(() => overviewQuery.data?.days ?? [], [overviewQuery.data])
  const weekSeconds = useMemo(
    () => overviewDays.slice(-7).reduce((sum, day) => sum + day.seconds, 0),
    [overviewDays],
  )
  const currentStreak = useMemo(() => calcCurrentStreak(overviewDays), [overviewDays])

  return {
    isLoading: overviewQuery.isLoading || periodsQuery.isLoading,
    isError: overviewQuery.isError || periodsQuery.isError,
    isRefetching: overviewQuery.isRefetching || periodsQuery.isRefetching,
    refetch: () => {
      void overviewQuery.refetch()
      void periodsQuery.refetch()
    },
    weekSeconds,
    currentStreak,
    periods,
    activeYear,
    selectYear: setSelectedYear,
    year: {
      data: yearQuery.data,
      isFetching: yearQuery.isFetching,
      isError: yearQuery.isError,
    },
  }
}
