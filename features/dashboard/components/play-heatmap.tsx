'use client'

import { Loader2Icon } from 'lucide-react'

import { useHeatmapCalendar } from '../hooks/use-heatmap-calendar'
import { getHeatmapLevel } from '../lib/heatmap-utils'
import HeatmapDayCell from './heatmap-day-cell'
import HeatmapSkeleton from './heatmap-skeleton'
import HeatmapStats from './heatmap-stats'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useChartSettings } from '@/features/appearance/hooks/use-chart-settings'
import { cn } from '@/lib/utils'

import type { RecordHeatmapPeriod, RecordPlayHeatmapMonth, RecordPlayHeatmapYear } from '@/types'

const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日']

type PlayHeatmapProps = {
  data?: RecordPlayHeatmapMonth
  year: { data?: RecordPlayHeatmapYear; isError: boolean; isFetching: boolean }
  periods: RecordHeatmapPeriod[]
  period: { year: number; month: number } | null
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  onSelectPeriod: (year: number, month: number) => void
}

export default function PlayHeatmap({
  data,
  year,
  periods,
  period,
  isLoading,
  isFetching,
  isError,
  onSelectPeriod,
}: PlayHeatmapProps) {
  const { color } = useChartSettings()

  const { cells, thresholds, todayKey, months, selectYear, selectMonth } = useHeatmapCalendar({
    data,
    periods,
    period,
    onSelectPeriod,
  })

  if (!period) {
    if (isLoading) {
      return <HeatmapSkeleton />
    }
    return (
      <div className="text-muted-foreground flex min-h-32 items-center justify-center text-sm">
        {isError ? '热力图加载失败，请稍后重试' : '还没有游玩记录'}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Select value={String(period.year)} onValueChange={selectYear}>
          <SelectTrigger size="sm" className="w-24" aria-label="选择年份">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {periods.map((item) => (
              <SelectItem key={item.year} value={String(item.year)}>
                {item.year}年
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={String(period.month)} onValueChange={selectMonth}>
          <SelectTrigger size="sm" className="w-20" aria-label="选择月份">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((month) => (
              <SelectItem key={month} value={String(month)}>
                {month}月
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isFetching || year.isFetching ? (
          <Loader2Icon className="text-muted-foreground size-4 animate-spin" aria-label="加载中" />
        ) : null}
      </div>

      <HeatmapStats
        yearSeconds={year.data?.totalSeconds}
        monthSeconds={data?.totalSeconds}
        isYearError={year.isError}
        isMonthError={isError}
      />

      {!data ? (
        isError ? (
          <p className="text-muted-foreground text-sm">热力图加载失败</p>
        ) : (
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {Array.from({ length: 35 }).map((_, index) => (
              <Skeleton key={index} className="aspect-square rounded-md" />
            ))}
          </div>
        )
      ) : (
        <>
          <div className={cn('grid grid-cols-7 gap-1 sm:gap-1.5', isFetching && 'opacity-60')}>
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className="text-muted-foreground flex h-6 items-center justify-center text-[11px]"
              >
                {label}
              </div>
            ))}

            {cells.map((day, index) =>
              day ? (
                <HeatmapDayCell
                  key={day.date}
                  day={day}
                  level={getHeatmapLevel(day.seconds, thresholds)}
                  color={color}
                  isToday={day.date === todayKey}
                />
              ) : (
                <div key={`blank-${index}`} className="aspect-square" />
              ),
            )}
          </div>
        </>
      )}
    </div>
  )
}
