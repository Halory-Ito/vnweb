'use client'

import { useQuery } from '@tanstack/react-query'
import {
  AwardIcon,
  CalendarIcon,
  MusicIcon,
  PlusIcon,
  QuoteIcon,
  TimerIcon,
  UserIcon,
  VideoIcon,
} from 'lucide-react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { fetchOverviewStatsApi } from './query-options'
import {
  ChartStatsCard,
  ChartStatsCardProps,
  RankStatsCard,
  SimpleStatsCard,
} from '@/components/record/stats-card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { useChartSettings } from '@/features/appearance/hooks/use-chart-settings'

export default function RecordOverview() {
  const isClient = typeof window !== 'undefined'
  const { color, opacity } = useChartSettings()

  const colorWithOpacity = `${color}${Math.round((opacity / 100) * 255)
    .toString(16)
    .padStart(2, '0')}`

  const chartConfig = {
    hours: {
      label: '小时',
      color: colorWithOpacity,
    },
  } satisfies ChartConfig

  const { data, isLoading, isError, isRefetching, refetch } = useQuery({
    queryKey: ['overview-stats'],
    queryFn: () => fetchOverviewStatsApi(),
    enabled: isClient,
  })

  if (isError) {
    return (
      <div className="space-y-3 rounded-md border p-4 text-sm">
        <div className="text-destructive">加载统计数据失败</div>
        <button
          type="button"
          className="rounded-md border px-3 py-1.5 text-xs"
          disabled={isRefetching}
          onClick={() => void refetch()}
        >
          {isRefetching ? '重试中...' : '重试'}
        </button>
      </div>
    )
  }

  if (isLoading || !data) {
    return <div className="text-muted-foreground rounded-md border p-4 text-sm">加载中...</div>
  }

  const chartCardData: ChartStatsCardProps[] = [
    {
      title: '游戏时长分布',
      description: `${new Date().getFullYear()} 年每月总时长`,
      children: (
        <ChartContainer config={chartConfig} className="max-h-64 w-full sm:min-h-32">
          <BarChart accessibilityLayer data={data.monthlyDurationDistribution}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} width={52} />
            <ChartTooltip
              content={
                <ChartTooltipContent formatter={(value) => `${Number(value).toFixed(2)} 小时`} />
              }
            />
            <Bar dataKey="hours" fill="var(--color-hours)" radius={4} />
          </BarChart>
        </ChartContainer>
      ),
    },
    {
      title: '游戏时间分布',
      description: `游戏高峰时段: ${data.peakHourLabel}`,
      children: (
        <ChartContainer config={chartConfig} className="max-h-64 w-full sm:min-h-32">
          <BarChart accessibilityLayer data={data.hourlyTimeDistribution}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={20} />
            <YAxis tickLine={false} axisLine={false} width={52} />
            <ChartTooltip
              content={
                <ChartTooltipContent formatter={(value) => `${Number(value).toFixed(2)} 小时`} />
              }
            />
            <Bar dataKey="hours" fill="var(--color-hours)" radius={4} />
          </BarChart>
        </ChartContainer>
      ),
    },
  ]

  return (
    <div className="w-full space-y-4">
      <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-4">
        <SimpleStatsCard
          title="游戏总数"
          icon={<PlusIcon className="h-4 w-4" />}
          value={data?.totalGames}
          unit={'个'}
        />
        <SimpleStatsCard
          title="游戏时长"
          icon={<TimerIcon className="h-4 w-4" />}
          value={data?.totalPlayTime}
          unit={'小时'}
        />
        <SimpleStatsCard
          title="游戏天数"
          icon={<CalendarIcon className="h-4 w-4" />}
          value={data?.totalDays}
          unit={'天'}
        />
        <SimpleStatsCard
          title="游戏次数"
          icon={<AwardIcon className="h-4 w-4" />}
          value={data?.totalPlayCount}
          unit={'次'}
        />
        <SimpleStatsCard
          title="角色数量"
          icon={<UserIcon className="h-4 w-4" />}
          value={data?.totalCharacters}
          unit={'个'}
        />
        <SimpleStatsCard
          title="OST数量"
          icon={<MusicIcon className="h-4 w-4" />}
          value={data?.totalOsts}
          unit={'个'}
        />
        <SimpleStatsCard
          title="PV数量"
          icon={<VideoIcon className="h-4 w-4" />}
          value={data?.totalPvs}
          unit={'个'}
        />
        <SimpleStatsCard
          title="台词数量"
          icon={<QuoteIcon className="h-4 w-4" />}
          value={data?.totalQuotes}
          unit={'条'}
        />
      </div>
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
        {chartCardData.map((data, index) => (
          <ChartStatsCard key={index} {...data} />
        ))}
      </div>
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
        <RankStatsCard title="游戏时间排行" rankItems={data.playTimeRank} unit="小时" />
        <RankStatsCard title="游戏评分排行" rankItems={data.ratingRank} unit="分" />
      </div>
    </div>
  )
}
