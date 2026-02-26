'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { AwardIcon, CalendarIcon, PlusIcon, TimerIcon } from 'lucide-react'
import { Bar, BarChart } from 'recharts'

import { fetchOverviewStatsApi } from './query-options'
import {
  ChartStatsCard,
  ChartStatsCardProps,
  RankItem,
  RankStatsCard,
  RankStatsCardProps,
  SimpleStatsCard,
} from '@/components/record/stats-card'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'

const chartData = [
  { month: 'January', desktop: 186, mobile: 80 },
  { month: 'February', desktop: 305, mobile: 200 },
  { month: 'March', desktop: 237, mobile: 120 },
  { month: 'April', desktop: 73, mobile: 190 },
  { month: 'May', desktop: 209, mobile: 130 },
  { month: 'June', desktop: 214, mobile: 140 },
]

const chartConfig = {
  desktop: {
    label: 'Desktop',
    color: '#2563eb',
  },
  mobile: {
    label: 'Mobile',
    color: '#60a5fa',
  },
} satisfies ChartConfig

const chartCardData: ChartStatsCardProps[] = [
  {
    title: '游戏时长分布',
    description: '38 分钟',
    children: (
      <ChartContainer
        config={chartConfig}
        className="max-h-64 w-full sm:min-h-32"
      >
        <BarChart accessibilityLayer data={chartData}>
          <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
          <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
        </BarChart>
      </ChartContainer>
    ),
  },
  {
    title: '游戏时间分布',
    description: '游戏高峰时段: 20:00 - 21:00',
    children: (
      <ChartContainer
        config={chartConfig}
        className="max-h-64 w-full sm:min-h-32"
      >
        <BarChart accessibilityLayer data={chartData}>
          <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
          <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
        </BarChart>
      </ChartContainer>
    ),
  },
]

const timeRankItems: RankItem[] = [
  {
    id: '1',
    cover: '/cover/wa2.jpg',
    title: '游戏 A',
    stat: 50.0,
  },
]
const rateRankItems: RankItem[] = [
  {
    id: '1',
    cover: '/cover/wa2.jpg',
    title: '游戏 A',
    stat: 8.0,
  },
]

const timeRankCardData: RankStatsCardProps = {
  title: '游戏时间排行',
  rankItems: timeRankItems,
  unit: '小时',
}

const rateRankCardData: RankStatsCardProps = {
  title: '游戏评分排行',
  rankItems: rateRankItems,
  unit: '分',
}

export default function RecordOverview() {
  const { data } = useSuspenseQuery({
    queryKey: ['overview-stats'],
    queryFn: () => fetchOverviewStatsApi(),
  })
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
      </div>
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
        {chartCardData.map((data, index) => (
          <ChartStatsCard key={index} {...data} />
        ))}
      </div>
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
        <RankStatsCard {...timeRankCardData} />
        <RankStatsCard {...rateRankCardData} />
      </div>
    </div>
  )
}
