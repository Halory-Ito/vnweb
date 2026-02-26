'use client'

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  AwardIcon,
  Calendar,
  TimerIcon,
} from 'lucide-react'
import { Bar, BarChart } from 'recharts'

import {
  ChartStatsCard,
  ChartStatsCardProps,
  SimpleStatsCard,
} from '@/components/record/stats-card'
import { Button } from '@/components/ui/button'
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
    title: '月度游戏时长',
    description: '',
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
    title: '月度游戏天数',
    description: '',
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

export default function YearRecord() {
  return (
    <div className="h-full w-full space-y-4">
      {/* header */}
      <div className="flex w-full items-center justify-between">
        <h1 className="mb-4 h-full text-2xl font-bold">年度游戏报告</h1>
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div>2026年</div>
          <Button variant="outline" size="icon">
            <ArrowRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {/* card */}
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
        <SimpleStatsCard
          title="年度游戏时长"
          icon={<TimerIcon />}
          value={38}
          unit={'分钟'}
        />
        <SimpleStatsCard
          title="游戏月份数"
          icon={<Calendar />}
          value={1}
          unit={'月'}
        />
        <SimpleStatsCard
          title="游戏最多的月份"
          icon={<AwardIcon />}
          value={2}
          unit={'月'}
        />
      </div>

      {/* Chart */}
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
        {chartCardData.map((data, index) => (
          <ChartStatsCard key={index} {...data} />
        ))}
      </div>
    </div>
  )
}
