'use client'

import { useQuery } from '@tanstack/react-query'
import { BookOpen, ExternalLink, Lightbulb } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { EmptyArtwork } from '@/components/ui/empty-artwork'
import { getGuideApi } from '@/features/guide'
import { CompleteAllButton } from '@/features/guide/components/complete-all-botton'
import { GameGuideCharacterPanel } from '@/features/guide/components/game-guide-character-panel'
import { GameGuideToolbar } from '@/features/guide/components/game-guide-toolbar'
import { GuideDetailHeader } from '@/features/guide/components/guide-detail-header'
import { GuideRoute } from '@/features/guide/components/guide-route'
import { ResetAllButton } from '@/features/guide/components/reset-all-botton'
import { useGuide } from '@/features/guide/hooks/use-guide'

export default function GameGuideView({ gameId }: { gameId: number }) {
  const [characterMode, setCharacterMode] = useState(false)
  const [hideCompleted, setHideCompleted] = useState(false)
  const [selectedEndingId, setSelectedEndingId] = useState<string | null>(null)

  const { data: guide, isLoading } = useQuery({
    queryKey: ['guide', gameId],
    queryFn: () => getGuideApi(gameId),
  })

  const {
    toggleStep,
    getEndingProgress,
    getRouteProgress,
    getTotalProgress,
    resetProgress,
    completeProgress,
    resetRouteProgress,
  } = useGuide(guide ?? null, gameId)

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="text-muted-foreground text-sm">加载中...</div>
      </div>
    )
  }

  if (!guide) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center gap-3 py-6">
        <EmptyArtwork />
        <p className="text-muted-foreground text-sm">暂无攻略数据</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/guide">
            <BookOpen className="size-4" />
            前往导入攻略
          </Link>
        </Button>
      </div>
    )
  }

  const totalProgress = getTotalProgress()
  const allEndings = guide.routes.flatMap((route) => route.endings)
  const selectedEnding = selectedEndingId
    ? (allEndings.find((ending) => ending.id === selectedEndingId) ?? null)
    : null

  return (
    <div className="w-full space-y-4 pt-2">
      <GuideDetailHeader
        title="攻略进度"
        description={`${totalProgress.completed}/${totalProgress.total} 步骤完成`}
        progress={totalProgress}
        actions={
          <>
            <Button
              asChild
              variant="outline"
              size="icon"
              className="h-8 w-8"
              title="打开独立攻略页"
            >
              <Link href={`/guide/${gameId}`} aria-label="打开独立攻略页">
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
            <ResetAllButton
              title="重置全部进度"
              description="确定要重置所有攻略进度吗？此操作将清除所有步骤的完成状态。"
              onConfirm={resetProgress}
              disabled={totalProgress.completed === 0}
              buttonTitle="重置全部"
            />
            <CompleteAllButton
              title="标记全部完成"
              description="确定要将所有攻略步骤标记为已完成吗？"
              onConfirm={completeProgress}
              disabled={totalProgress.completed === totalProgress.total}
              buttonTitle="标记全部完成"
            />
          </>
        }
      />

      {guide.tips.length > 0 && (
        <div className="flex flex-col gap-1.5 rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-400">
          {guide.tips.map((tip, index) => (
            <div key={index} className="flex items-start gap-2">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500/80" />
              <span className="leading-relaxed">{tip}</span>
            </div>
          ))}
        </div>
      )}

      <GameGuideToolbar
        characterMode={characterMode}
        onCharacterModeChange={(checked) => {
          setCharacterMode(checked)
          if (!checked) setSelectedEndingId(null)
        }}
        hideCompleted={hideCompleted}
        onToggleHideCompleted={() => setHideCompleted((prev) => !prev)}
      />

      {characterMode ? (
        <GameGuideCharacterPanel
          endings={allEndings}
          selectedEnding={selectedEnding}
          hideCompleted={hideCompleted}
          getEndingProgress={getEndingProgress}
          onSelectEnding={setSelectedEndingId}
          onToggleStep={toggleStep}
        />
      ) : (
        <div className="space-y-4">
          {guide.routes.map((route) => (
            <GuideRoute
              key={route.id}
              route={route}
              progress={getRouteProgress(route)}
              hideCompleted={hideCompleted}
              onToggleStep={toggleStep}
              onResetRoute={() => resetRouteProgress(route)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
