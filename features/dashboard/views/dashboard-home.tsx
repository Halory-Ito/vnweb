'use client'

import { AlertCircle, CalendarDaysIcon, FlameIcon, TimerIcon, TrophyIcon } from 'lucide-react'

import DashboardSkeleton from '../components/dashboard-skeleton'
import EmptyLibrary from '../components/empty-library'
import GoalSection from '../components/goal-section'
import PlayHeatmap from '../components/play-heatmap'
import RandomQuote from '../components/random-quote'
import StatStrip from '../components/stat-strip'
import WelcomeBar from '../components/welcome-bar'
import { useDashboardGames } from '../hooks/use-dashboard-games'
import { usePlayHeatmap } from '../hooks/use-play-heatmap'
import { useRandomQuote } from '../hooks/use-random-quote'
import { Button } from '@/components/ui/button'

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
      <div className="max-h-[100cqh] w-full space-y-4 overflow-x-hidden overflow-y-auto p-3 sm:p-4">
        <WelcomeBar />
        <EmptyLibrary />
      </div>
    )
  }

  return (
    <div className="max-h-[100cqh] w-full overflow-x-hidden overflow-y-auto p-3 sm:p-4">
      <div className="space-y-4">
        <RandomQuote
          quote={randomQuote.quote}
          isLoading={randomQuote.isLoading}
          isError={randomQuote.isError}
        />
        <StatStrip items={statItems} />

        <GoalSection />

        <PlayHeatmap
          key={heatmap.activeYear}
          year={heatmap.year}
          periods={heatmap.periods}
          activeYear={heatmap.activeYear}
          onSelectYear={heatmap.selectYear}
        />
      </div>
    </div>
  )
}
