'use client'

import { usePlayCalendar } from '../hooks/use-play-calendar'
import { formatPlayDuration } from '../lib/format-utils'
import { getHeatmapLevel } from '../lib/heatmap-utils'
import HeatmapDayCell from './heatmap-day-cell'
import HeatmapDayRecords from './heatmap-day-records'
import HeatmapSkeleton from './heatmap-skeleton'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useChartSettings } from '@/features/appearance/hooks/use-chart-settings'

import type { RecordHeatmapPeriod, RecordPlayHeatmapYear } from '@/types'

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

type PlayHeatmapProps = {
  year: { data?: RecordPlayHeatmapYear; isError: boolean; isFetching: boolean }
  periods: RecordHeatmapPeriod[]
  activeYear: number
  onSelectYear: (year: number) => void
}

export default function PlayHeatmap({ year, periods, activeYear, onSelectYear }: PlayHeatmapProps) {
  const { color } = useChartSettings()
  const calendar = usePlayCalendar(activeYear, year.data?.days ?? [])

  return (
    <Card variant="outline" className="@container gap-0 py-0">
      <CardContent className="grid min-w-0 px-0 @min-[38rem]:grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)]">
        <section
          aria-label="游玩月历"
          aria-busy={year.isFetching}
          className="min-w-0 space-y-3 p-3 sm:p-4"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={String(activeYear)}
              onValueChange={(value) => onSelectYear(Number(value))}
            >
              <SelectTrigger size="sm" className="w-24" aria-label="选择年份">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periods.map(({ year }) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}年
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(calendar.month)}
              onValueChange={(value) => calendar.selectMonth(Number(value))}
            >
              <SelectTrigger size="sm" className="w-20" aria-label="选择月份">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, index) => (
                  <SelectItem key={index} value={String(index + 1)}>
                    {index + 1}月
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {year.data ? (
              <p className="text-muted-foreground text-xs tabular-nums">
                全年 {formatPlayDuration(year.data.totalSeconds)}
              </p>
            ) : null}
          </div>
          {year.isError ? (
            <p className="text-muted-foreground text-sm">月历加载失败，请稍后重试。</p>
          ) : !year.data ? (
            <HeatmapSkeleton />
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {WEEKDAYS.map((label) => (
                <span key={label} className="text-muted-foreground py-1 text-center text-xs">
                  {label}
                </span>
              ))}
              {calendar.cells.map((day, index) =>
                day ? (
                  <HeatmapDayCell
                    key={day.date}
                    day={day}
                    color={color}
                    level={getHeatmapLevel(day.seconds, calendar.thresholds)}
                    isToday={day.date === calendar.todayKey}
                    isSelected={day.date === calendar.date}
                    onSelect={() => calendar.setSelectedDate(day.date)}
                  />
                ) : (
                  <div key={index} aria-hidden="true" />
                ),
              )}
            </div>
          )}
        </section>
        <div className="min-w-0 border-t p-3 sm:p-4 @min-[38rem]:border-t-0 @min-[38rem]:border-l">
          <HeatmapDayRecords
            date={calendar.date}
            games={calendar.records.data}
            isError={year.isError || calendar.records.isError}
          />
        </div>
      </CardContent>
    </Card>
  )
}
