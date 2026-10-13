'use client'

import { AlertCircle, CalendarDaysIcon, FlameIcon, TimerIcon, TrophyIcon } from 'lucide-react'

import DashboardSkeleton from '../components/dashboard-skeleton'
import EmptyLibrary from '../components/empty-library'
import PlayHeatmap from '../components/play-heatmap'
import RandomQuote from '../components/random-quote'
import StatStrip from '../components/stat-strip'
import WelcomeBar from '../components/welcome-bar'
import { useDashboardGames } from '../hooks/use-dashboard-games'
import { usePlayHeatmap } from '../hooks/use-play-heatmap'
import { useRandomQuote } from '../hooks/use-random-quote'
import { Button } from '@/components/ui/button'
import { RecentVisitsSection } from '@/features/recent'

import type { StatsCardProps } from '@/features/record'

export default function DashboardHome() {
  const games = useDashboardGames()
  const heatmap = usePlayHeatmap()
  const randomQuote = useRandomQuote()

  const isLoading = games.isLoading || heatmap.isLoading
  const isError = games.isError || heatmap.isError
  const isRefetching = games.isRefetching || heatmap.isRefetching

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (isError) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full items-center justify-center p-4">
        <div className="bg-background/80 w-full max-w-xl rounded-2xl border px-6 py-10 text-center shadow-sm backdrop-blur-sm">
          <div className="bg-muted text-muted-foreground mx-auto mb-4 flex size-14 items-center justify-center rounded-full border">
            <AlertCircle className="size-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">加载首页数据失败</h2>
            <p className="text-muted-foreground text-sm leading-6">
              当前无法读取游戏与游玩数据，请稍后重试。
            </p>
          </div>
          <div className="mt-6 flex justify-center">
            <Button
              type="button"
              variant="outline"
              disabled={isRefetching}
              onClick={() => {
                void games.refetch()
                heatmap.refetch()
              }}
            >
              {isRefetching ? '重试中...' : '重新加载'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const statItems: StatsCardProps[] = [
    {
      title: '近 7 天游玩',
      icon: <CalendarDaysIcon className="h-4 w-4" />,
      value: (heatmap.weekSeconds / 3600).toFixed(1),
      unit: '小时',
    },
    {
      title: '连续游玩',
      icon: <FlameIcon className="h-4 w-4" />,
      value: heatmap.currentStreak,
      unit: '天',
    },
    {
      title: '总游戏时长',
      icon: <TimerIcon className="h-4 w-4" />,
      value: (games.totalPlayTime / 3600).toFixed(1),
      unit: '小时',
    },
    {
      title: '已通关',
      icon: <TrophyIcon className="h-4 w-4" />,
      value: games.completedCount,
      unit: `/ ${games.cards.length} 个`,
    },
  ]

  if (games.cards.length === 0) {
    return (
      <div className="max-h-[calc(100vh-80px)] w-full space-y-4 overflow-x-hidden overflow-y-auto p-3 sm:p-4">
        <WelcomeBar />
        <EmptyLibrary />
      </div>
    )
  }

  return (
    <div className="max-h-[calc(100vh-80px)] w-full overflow-x-hidden overflow-y-auto p-3 sm:p-4">
      <div className="space-y-4">
        <WelcomeBar />
        <StatStrip items={statItems} />

        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-5">
          {/* 左栏：最近访问 + 随机摘录 */}
          <div className="order-2 space-y-4 xl:order-none xl:col-span-3">
            <RecentVisitsSection />
            <RandomQuote
              quote={randomQuote.quote}
              isLoading={randomQuote.isLoading}
              isError={randomQuote.isError}
            />
          </div>

          {/* 右栏：游玩热力图 */}
          <div className="order-1 xl:order-none xl:col-span-2">
            <PlayHeatmap
              data={heatmap.month.data}
              periods={heatmap.periods}
              period={heatmap.period}
              isLoading={heatmap.month.isLoading}
              isFetching={heatmap.month.isFetching}
              isError={heatmap.month.isError}
              onSelectPeriod={heatmap.selectPeriod}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
