'use client'

import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BarChart3Icon,
  CalendarIcon,
  ChartLineIcon,
  TimerIcon,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  Cell,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceArea,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts'

import {
  fetchRecordMonthReportApi,
  fetchRecordYearReportApi,
  fetchRecordTimelineApi,
  type RecordTimelineRange,
} from '@/app/record/query-options'
import {
  ChartStatsCard,
  RankStatsCard,
  SimpleStatsCard,
} from '@/components/record/stats-card'
import { Button } from '@/components/ui/button'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

type RecordChartType = 'line' | 'bar'
type DistributionMode = 'type' | 'publisher'

type RecordPeriodPanelProps = {
  range: RecordTimelineRange
  title: string
}

const chartConfig = {
  hours: {
    label: '游戏时长(小时)',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig

const monthlyDaysChartConfig = {
  activeDays: {
    label: '活跃天数',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig

const monthlyFrequencyChartConfig = {
  count: {
    label: '游玩频率',
    color: 'var(--chart-4)',
  },
} satisfies ChartConfig

const pieColors = [
  '#2563eb',
  '#16a34a',
  '#f59e0b',
  '#dc2626',
  '#0ea5e9',
  '#7c3aed',
  '#ea580c',
  '#db2777',
]

const formatDurationText = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  return `${hours} 小时 ${minutes} 分钟`
}

const formatHours = (seconds: number) => Number((seconds / 3600).toFixed(2))

export default function RecordPeriodPanel({
  range,
  title,
}: RecordPeriodPanelProps) {
  const isClient = typeof window !== 'undefined'
  const [offset, setOffset] = useState(0)
  const [chartType, setChartType] = useState<RecordChartType>('line')
  const [yearlyChartType, setYearlyChartType] = useState<RecordChartType>('bar')
  const [monthlyChartType, setMonthlyChartType] =
    useState<RecordChartType>('bar')
  const [distributionMode, setDistributionMode] =
    useState<DistributionMode>('type')

  const { data, isLoading, isRefetching } = useQuery({
    queryKey: ['record-timeline', range, offset],
    queryFn: () => fetchRecordTimelineApi({ range, offset }),
    enabled: isClient,
  })

  const {
    data: monthReport,
    isLoading: isMonthLoading,
    isRefetching: isMonthRefetching,
  } = useQuery({
    queryKey: ['record-month-report', offset],
    queryFn: () => fetchRecordMonthReportApi({ offset }),
    enabled: isClient && range === 'month',
  })

  const {
    data: yearReport,
    isLoading: isYearLoading,
    isRefetching: isYearRefetching,
  } = useQuery({
    queryKey: ['record-year-report', offset],
    queryFn: () => fetchRecordYearReportApi({ offset }),
    enabled: isClient && range === 'year',
  })

  const points = data?.points ?? []
  const averageHours = useMemo(() => {
    if (points.length === 0) {
      return 0
    }
    const total = points.reduce((sum, item) => sum + item.hours, 0)
    return Number((total / points.length).toFixed(2))
  }, [points])

  const todayKey =
    range === 'year' ? dayjs().format('YYYY-MM') : dayjs().format('YYYY-MM-DD')
  const todayLabel = points.find((item) => item.key === todayKey)?.label

  const yearlyDistributionRaw =
    distributionMode === 'type'
      ? (yearReport?.distributionByType ?? [])
      : (yearReport?.distributionByPublisher ?? [])
  const yearlyDistribution = yearlyDistributionRaw.slice(0, 8)
  const yearlyTotalSeconds = yearlyDistributionRaw.reduce(
    (sum, item) => sum + item.seconds,
    0,
  )
  const monthFrequencyData = (monthReport?.gameFrequency ?? []).slice(0, 10)

  return (
    <div className="h-full w-full space-y-4">
      <div className="flex w-full items-center justify-between">
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setOffset((prev) => prev - 1)}
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div>{data?.periodLabel || '-'}</div>
          <Button
            variant="outline"
            size="icon"
            disabled={offset === 0}
            onClick={() => setOffset((prev) => Math.min(0, prev + 1))}
          >
            <ArrowRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
        <SimpleStatsCard
          title="区间游戏时长"
          icon={<TimerIcon className="h-4 w-4" />}
          value={data?.totalHours ?? 0}
          unit="小时"
        />
        <SimpleStatsCard
          title={range === 'year' ? '活跃月份数' : '活跃天数'}
          icon={<CalendarIcon className="h-4 w-4" />}
          value={data?.activeCount ?? 0}
          unit={range === 'year' ? '月' : '天'}
        />
        <SimpleStatsCard
          title="峰值时段"
          icon={<BarChart3Icon className="h-4 w-4" />}
          value={data?.peakLabel ?? '-'}
          unit={data ? `(${formatHours(data.peakSeconds)}h)` : ''}
        />
      </div>

      {range === 'year' ? (
        <>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={yearlyChartType === 'line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setYearlyChartType('line')}
            >
              <ChartLineIcon className="size-4" />
              折线图
            </Button>
            <Button
              type="button"
              variant={yearlyChartType === 'bar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setYearlyChartType('bar')}
            >
              <BarChart3Icon className="size-4" />
              柱状图
            </Button>
          </div>

          <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartStatsCard
              title="月度游戏时长"
              description="展示全年每个月的游戏总时长"
            >
              {isYearLoading || isYearRefetching ? (
                <div className="text-muted-foreground rounded-md border p-4 text-sm">
                  加载中...
                </div>
              ) : (
                <ChartContainer config={chartConfig} className="h-72 w-full">
                  {yearlyChartType === 'line' ? (
                    <LineChart data={yearReport?.monthlyStats ?? []}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        width={56}
                        tickFormatter={(v: number) => `${v}h`}
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value) =>
                              `${Number(value).toFixed(2)} 小时`
                            }
                          />
                        }
                      />
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
                    <BarChart data={yearReport?.monthlyStats ?? []}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        width={56}
                        tickFormatter={(v: number) => `${v}h`}
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value) =>
                              `${Number(value).toFixed(2)} 小时`
                            }
                          />
                        }
                      />
                      <Bar
                        dataKey="hours"
                        fill="var(--color-hours)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  )}
                </ChartContainer>
              )}
            </ChartStatsCard>

            <ChartStatsCard
              title="月度游戏天数"
              description="展示全年每个月有游玩记录的天数"
            >
              {isYearLoading || isYearRefetching ? (
                <div className="text-muted-foreground rounded-md border p-4 text-sm">
                  加载中...
                </div>
              ) : (
                <ChartContainer
                  config={monthlyDaysChartConfig}
                  className="h-72 w-full"
                >
                  {yearlyChartType === 'line' ? (
                    <LineChart data={yearReport?.monthlyStats ?? []}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis tickLine={false} axisLine={false} width={48} />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value) => `${Number(value)} 天`}
                          />
                        }
                      />
                      <Line
                        type="monotone"
                        dataKey="activeDays"
                        stroke="var(--color-activeDays)"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  ) : (
                    <BarChart data={yearReport?.monthlyStats ?? []}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis tickLine={false} axisLine={false} width={48} />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value) => `${Number(value)} 天`}
                          />
                        }
                      />
                      <Bar
                        dataKey="activeDays"
                        fill="var(--color-activeDays)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  )}
                </ChartContainer>
              )}
            </ChartStatsCard>
          </div>

          <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartStatsCard
              title="年度游戏时间分布"
              description={
                distributionMode === 'type'
                  ? '默认按游戏类型统计，可切换到发行商'
                  : '当前按发行商统计，可切换到游戏类型'
              }
            >
              <div className="mb-3 flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={distributionMode === 'type' ? 'default' : 'outline'}
                  onClick={() => setDistributionMode('type')}
                >
                  按游戏类型
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={
                    distributionMode === 'publisher' ? 'default' : 'outline'
                  }
                  onClick={() => setDistributionMode('publisher')}
                >
                  按发行商
                </Button>
              </div>

              {isYearLoading || isYearRefetching ? (
                <div className="text-muted-foreground rounded-md border p-4 text-sm">
                  加载中...
                </div>
              ) : yearlyDistribution.length === 0 ? (
                <div className="text-muted-foreground rounded-md border p-4 text-sm">
                  暂无数据
                </div>
              ) : (
                <div className="space-y-3">
                  <ChartContainer config={chartConfig} className="h-72 w-full">
                    <PieChart>
                      <Pie
                        data={yearlyDistribution}
                        dataKey="seconds"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ percent }) =>
                          `${((percent || 0) * 100).toFixed(0)}%`
                        }
                      >
                        {yearlyDistribution.map((item, index) => (
                          <Cell
                            key={item.key}
                            fill={pieColors[index % pieColors.length]}
                          />
                        ))}
                      </Pie>
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(_value, _name, entry) => {
                              const seconds = Number(
                                entry?.payload?.seconds || 0,
                              )
                              const hours = Number((seconds / 3600).toFixed(2))
                              const ratio =
                                yearlyTotalSeconds > 0
                                  ? (
                                      (seconds / yearlyTotalSeconds) *
                                      100
                                    ).toFixed(1)
                                  : '0.0'
                              return `${hours} 小时 (${ratio}%)`
                            }}
                          />
                        }
                      />
                    </PieChart>
                  </ChartContainer>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {yearlyDistribution.map((item, index) => (
                      <div
                        key={`${item.key}-legend`}
                        className="flex items-center justify-between rounded-md border px-2 py-1.5 text-sm"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-sm"
                            style={{
                              backgroundColor:
                                pieColors[index % pieColors.length],
                            }}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>
                        <span>{item.hours}h</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </ChartStatsCard>

            <RankStatsCard
              title="年度游戏排名"
              rankItems={yearReport?.gameRank ?? []}
              unit="小时"
              previewCount={5}
            />
          </div>
        </>
      ) : null}

      {range === 'month' ? (
        <>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={monthlyChartType === 'line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMonthlyChartType('line')}
            >
              <ChartLineIcon className="size-4" />
              折线图
            </Button>
            <Button
              type="button"
              variant={monthlyChartType === 'bar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMonthlyChartType('bar')}
            >
              <BarChart3Icon className="size-4" />
              柱状图
            </Button>
          </div>

          <ChartStatsCard
            title="每日游戏时长统计"
            description="展示本月每天的总游玩时长"
          >
            {isMonthLoading || isMonthRefetching ? (
              <div className="text-muted-foreground rounded-md border p-4 text-sm">
                加载中...
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-72 w-full">
                {monthlyChartType === 'line' ? (
                  <LineChart data={monthReport?.dailyStats ?? []}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={56}
                      tickFormatter={(v: number) => `${v}h`}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(_value, _name, item) => {
                            const seconds = Number(item?.payload?.seconds || 0)
                            const hours = Number((seconds / 3600).toFixed(2))
                            return `${hours} 小时 (${formatDurationText(seconds)})`
                          }}
                          labelFormatter={(label) => `日期：${label}日`}
                        />
                      }
                    />
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
                  <BarChart data={monthReport?.dailyStats ?? []}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={56}
                      tickFormatter={(v: number) => `${v}h`}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(_value, _name, item) => {
                            const seconds = Number(item?.payload?.seconds || 0)
                            const hours = Number((seconds / 3600).toFixed(2))
                            return `${hours} 小时 (${formatDurationText(seconds)})`
                          }}
                          labelFormatter={(label) => `日期：${label}日`}
                        />
                      }
                    />
                    <Bar
                      dataKey="hours"
                      fill="var(--color-hours)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                )}
              </ChartContainer>
            )}
          </ChartStatsCard>

          <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartStatsCard
              title="本月游戏频率"
              description="按游玩记录次数统计（展示前10）"
            >
              {isMonthLoading || isMonthRefetching ? (
                <div className="text-muted-foreground rounded-md border p-4 text-sm">
                  加载中...
                </div>
              ) : monthFrequencyData.length === 0 ? (
                <div className="text-muted-foreground rounded-md border p-4 text-sm">
                  暂无数据
                </div>
              ) : (
                <ChartContainer
                  config={monthlyFrequencyChartConfig}
                  className="h-72 w-full"
                >
                  <BarChart data={monthFrequencyData}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      minTickGap={12}
                    />
                    <YAxis tickLine={false} axisLine={false} width={40} />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => `${Number(value)} 次`}
                        />
                      }
                    />
                    <Bar
                      dataKey="count"
                      fill="var(--color-count)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              )}
            </ChartStatsCard>

            <RankStatsCard
              title="本月游戏时长排名"
              rankItems={monthReport?.playTimeRank ?? []}
              unit="小时"
              previewCount={3}
            />
          </div>
        </>
      ) : null}
    </div>
  )
}
