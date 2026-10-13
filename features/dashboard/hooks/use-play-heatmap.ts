'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import { calcCurrentStreak } from '../lib/heatmap-utils'
import { getPlayHeatmapApi, getPlayHeatmapMonthApi, getPlayHeatmapPeriodsApi } from '@/api'

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

  const periods = periodsQuery.data?.periods ?? []
  const [selectedPeriod, setSelectedPeriod] = useState<{ year: number; month: number } | null>(null)
  const period = selectedPeriod ?? periodsQuery.data?.latest ?? null

  // 选中月份的每日数据
  const monthQuery = useQuery({
    queryKey: ['play-heatmap-month', period?.year ?? null, period?.month ?? null],
    queryFn: () => getPlayHeatmapMonthApi({ year: period?.year, month: period?.month }),
    enabled: Boolean(period),
    placeholderData: keepPreviousData,
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
    period,
    selectPeriod: (year: number, month: number) => setSelectedPeriod({ year, month }),
    month: {
      data: monthQuery.data,
      isLoading: monthQuery.isLoading,
      isFetching: monthQuery.isFetching,
      isError: monthQuery.isError,
    },
  }
}
