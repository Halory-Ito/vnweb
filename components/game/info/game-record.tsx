'use client'

import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import {
  BarChart3Icon,
  ChartLineIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts'

import { Button } from '@/components/ui/button'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { getGameTimerRecordsById } from '@/lib/game-utils'

type GameRecordProps = {
  gameId: number
}

type RecordRange = 'week' | 'month' | 'year'
type RecordChartType = 'line' | 'bar'

type ChartPoint = {
  key: string
  label: string
  seconds: number
  hours: number
}

const chartConfig = {
  hours: {
    label: '游戏时长(小时)',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig

const formatHours = (seconds: number) => {
  const safe = Math.max(0, Number(seconds) || 0)
  return Number((safe / 3600).toFixed(2))
}

export default function GameRecord({ gameId }: GameRecordProps) {
  const [range, setRange] = useState<RecordRange>('week')
  const [chartType, setChartType] = useState<RecordChartType>('line')
  const [periodOffset, setPeriodOffset] = useState(0)

  const { data, isLoading, isRefetching } = useQuery({
    queryKey: ['game-records', gameId],
    queryFn: () => getGameTimerRecordsById(gameId),
    enabled: Boolean(gameId),
  })

  const periodInfo = useMemo(() => {
    const base = dayjs()
    if (range === 'week') {
      const start = base.add(periodOffset, 'week').startOf('week')
      const end = start.endOf('week')
      return {
        start,
        end,
        label: `${start.format('YYYY-MM-DD')} ~ ${end.format('YYYY-MM-DD')}`,
      }
    }

    if (range === 'month') {
      const start = base.add(periodOffset, 'month').startOf('month')
      const end = start.endOf('month')
      return {
        start,
        end,
        label: `${start.format('YYYY年MM月')}`,
      }
    }

    const start = base.add(periodOffset, 'year').startOf('year')
    const end = start.endOf('year')
    return {
      start,
      end,
      label: `${start.format('YYYY年')}`,
    }
  }, [periodOffset, range])

  const chartData = useMemo(() => {
    const records = data?.records ?? []
    const { start, end } = periodInfo

    const bucket = new Map<string, number>()

    for (const item of records) {
      const startAt = dayjs(item.startAt)
      if (!startAt.isValid()) {
        continue
      }

      if (startAt.isBefore(start) || startAt.isAfter(end)) {
        continue
      }

      const key =
        range === 'year'
          ? startAt.format('YYYY-MM')
          : startAt.format('YYYY-MM-DD')
      bucket.set(
        key,
        (bucket.get(key) || 0) + Math.max(0, item.durationSeconds || 0),
      )
    }

    const result: ChartPoint[] = []

    if (range === 'year') {
      let cursor = start.startOf('month')
      const lastMonth = end.endOf('month')

      while (cursor.isBefore(lastMonth) || cursor.isSame(lastMonth, 'month')) {
        const key = cursor.format('YYYY-MM')
        const seconds = bucket.get(key) || 0
        result.push({
          key,
          label: cursor.format('M月'),
          seconds,
          hours: formatHours(seconds),
        })
        cursor = cursor.add(1, 'month')
      }

      return result
    }

    let cursor = start.startOf('day')
    const lastDay = end.endOf('day')

    while (cursor.isBefore(lastDay) || cursor.isSame(lastDay, 'day')) {
      const key = cursor.format('YYYY-MM-DD')
      const seconds = bucket.get(key) || 0
      result.push({
        key,
        label: cursor.format('MM-DD'),
        seconds,
        hours: formatHours(seconds),
      })
      cursor = cursor.add(1, 'day')
    }

    return result
  }, [data?.records, periodInfo, range])

  const totalHours = useMemo(
    () =>
      Number(chartData.reduce((sum, item) => sum + item.hours, 0).toFixed(2)),
    [chartData],
  )

  const averageHours = useMemo(() => {
    if (chartData.length === 0) {
      return 0
    }
    return Number((totalHours / chartData.length).toFixed(2))
  }, [chartData.length, totalHours])

  const todayKey = useMemo(() => {
    if (range === 'year') {
      return dayjs().format('YYYY-MM')
    }
    return dayjs().format('YYYY-MM-DD')
  }, [range])

  const todayLabel = chartData.find((item) => item.key === todayKey)?.label

  const formatDurationText = (seconds: number) => {
    const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0))
    const hours = Math.floor(safeSeconds / 3600)
    const minutes = Math.floor((safeSeconds % 3600) / 60)
    return `${hours} 小时 ${minutes} 分钟`
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={range === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setRange('week')
              setPeriodOffset(0)
            }}
          >
            周
          </Button>
          <Button
            type="button"
            variant={range === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setRange('month')
              setPeriodOffset(0)
            }}
          >
            月
          </Button>
          <Button
            type="button"
            variant={range === 'year' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setRange('year')
              setPeriodOffset(0)
            }}
          >
            年
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={chartType === 'line' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('line')}
          >
            <ChartLineIcon className="size-4" />
            折线图
          </Button>
          <Button
            type="button"
            variant={chartType === 'bar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('bar')}
          >
            <BarChart3Icon className="size-4" />
            柱状图
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPeriodOffset((prev) => prev - 1)}
          >
            <ChevronLeftIcon className="size-4" />
            上一周期
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={periodOffset === 0}
            onClick={() => setPeriodOffset((prev) => Math.min(0, prev + 1))}
          >
            下一周期
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
        <div className="text-muted-foreground text-sm">{periodInfo.label}</div>
      </div>

      <div className="text-muted-foreground text-sm">
        当前区间总时长：
        <span className="text-foreground font-medium">{totalHours}</span> 小时
      </div>

      {isLoading || isRefetching ? (
        <div className="space-y-3 rounded-md border p-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-72 w-full" />
        </div>
      ) : (
        <ChartContainer config={chartConfig} className="h-72 w-full">
          {chartType === 'line' ? (
            <LineChart data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                minTickGap={16}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={52}
                tickFormatter={(value: number) => `${value}h`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(_value, _name, item) => {
                      const seconds = Number(item?.payload?.seconds || 0)
                      const hours = Number((seconds / 3600).toFixed(2))
                      return `${hours} 小时 (${formatDurationText(seconds)})`
                    }}
                    labelFormatter={(_label, payload) => {
                      const key = String(payload?.[0]?.payload?.key || '')
                      if (!key) {
                        return '日期：-'
                      }
                      if (range === 'year') {
                        return `日期：${dayjs(key, 'YYYY-MM').format('YYYY年MM月')}`
                      }
                      return `日期：${dayjs(key, 'YYYY-MM-DD').format('YYYY-MM-DD')}`
                    }}
                  />
                }
              />
              {todayLabel ? (
                <ReferenceArea
                  x1={todayLabel}
                  x2={todayLabel}
                  fill="var(--chart-2)"
                  fillOpacity={0.18}
                />
              ) : null}
              {averageHours > 0 ? (
                <ReferenceLine
                  y={averageHours}
                  stroke="var(--chart-3)"
                  strokeDasharray="4 4"
                  label={{
                    value: `平均 ${averageHours}h`,
                    position: 'insideTopRight',
                  }}
                />
              ) : null}
              <Line
                type="monotone"
                dataKey="hours"
                stroke="var(--color-hours)"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          ) : (
            <BarChart data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                minTickGap={16}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={52}
                tickFormatter={(value: number) => `${value}h`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(_value, _name, item) => {
                      const seconds = Number(item?.payload?.seconds || 0)
                      const hours = Number((seconds / 3600).toFixed(2))
                      return `${hours} 小时 (${formatDurationText(seconds)})`
                    }}
                    labelFormatter={(_label, payload) => {
                      const key = String(payload?.[0]?.payload?.key || '')
                      if (!key) {
                        return '日期：-'
                      }
                      if (range === 'year') {
                        return `日期：${dayjs(key, 'YYYY-MM').format('YYYY年MM月')}`
                      }
                      return `日期：${dayjs(key, 'YYYY-MM-DD').format('YYYY-MM-DD')}`
                    }}
                  />
                }
              />
              {todayLabel ? (
                <ReferenceArea
                  x1={todayLabel}
                  x2={todayLabel}
                  fill="var(--chart-2)"
                  fillOpacity={0.18}
                />
              ) : null}
              {averageHours > 0 ? (
                <ReferenceLine
                  y={averageHours}
                  stroke="var(--chart-3)"
                  strokeDasharray="4 4"
                  label={{
                    value: `平均 ${averageHours}h`,
                    position: 'insideTopRight',
                  }}
                />
              ) : null}
              <Bar
                dataKey="hours"
                fill="var(--color-hours)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          )}
        </ChartContainer>
      )}
    </div>
  )
}
