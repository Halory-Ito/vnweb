'use client'

import dayjs from 'dayjs'
import { Loader2Icon } from 'lucide-react'
import { useMemo } from 'react'

import {
  buildMonthCells,
  getHeatmapLevel,
  getHeatmapThresholds,
  HEATMAP_LEVEL_ALPHAS,
} from '../lib/heatmap-utils'
import HeatmapDayCell from './heatmap-day-cell'
import HeatmapSkeleton from './heatmap-skeleton'
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

import type { RecordHeatmapPeriod, RecordPlayHeatmapMonth } from '@/types'

const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日']

type PlayHeatmapProps = {
  data?: RecordPlayHeatmapMonth
  periods: RecordHeatmapPeriod[]
  period: { year: number; month: number } | null
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  onSelectPeriod: (year: number, month: number) => void
}

export default function PlayHeatmap({
  data,
  periods,
  period,
  isLoading,
  isFetching,
  isError,
  onSelectPeriod,
}: PlayHeatmapProps) {
  const { color } = useChartSettings()

  const days = data?.days ?? []
  const cells = useMemo(() => buildMonthCells(days), [days])
  const thresholds = useMemo(() => getHeatmapThresholds(days), [days])
  const todayKey = dayjs().format('YYYY-MM-DD')

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

  const months = periods.find((item) => item.year === period.year)?.months ?? [period.month]

  const handleYearChange = (value: string) => {
    const nextYear = Number(value)
    const nextMonths = periods.find((item) => item.year === nextYear)?.months ?? []
    if (nextMonths.length === 0) {
      return
    }
    const nextMonth = nextMonths.includes(period.month)
      ? period.month
      : nextMonths[nextMonths.length - 1]
    onSelectPeriod(nextYear, nextMonth)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Select value={String(period.year)} onValueChange={handleYearChange}>
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

        <Select
          value={String(period.month)}
          onValueChange={(value) => onSelectPeriod(period.year, Number(value))}
        >
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

        {isFetching ? <Loader2Icon className="text-muted-foreground size-4 animate-spin" /> : null}
      </div>

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
