'use client'

import { useQuery } from '@tanstack/react-query'
import { BookOpen, RotateCcw } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { EditGuide } from '@/features/guide/components/edit-guide'
import { RouteCard } from '@/features/guide/components/route-card'
import { getGuideApi } from '@/features/guide/guide-api'
import { useGuide } from '@/features/guide/hooks/use-guide'

interface GuideDetailViewProps {
  gameId: number
}

export function GuideDetailView({ gameId }: GuideDetailViewProps) {
  const router = useRouter()

  const { data: guide, isLoading } = useQuery({
    queryKey: ['guide', gameId],
    queryFn: () => getGuideApi(gameId),
  })

  const { getRouteProgress, getTotalProgress, resetProgress } = useGuide(guide ?? null, gameId)

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  if (!guide) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <BookOpen className="text-muted-foreground h-10 w-10" />
        <p className="text-muted-foreground text-sm">暂无攻略数据</p>
        <p className="text-muted-foreground text-xs">请先导入攻略</p>
      </div>
    )
  }

  const totalProgress = getTotalProgress()

  return (
    <div className="max-h-[calc(100vh-144px)] w-full space-y-4 overflow-y-auto p-4">
      {/* 返回按钮 */}
      <Button variant="ghost" size="sm" onClick={() => router.push(`/guide`)}>
        ← 返回攻略
      </Button>
      {/* 攻略信息 */}
      <Card variant="default">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{guide.name}</CardTitle>
              <CardDescription>
                {totalProgress.completed}/{totalProgress.total} 步骤完成
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <EditGuide gameId={gameId} />
              <Button variant="outline" size="sm" onClick={resetProgress}>
                <RotateCcw className="mr-2 h-4 w-4" />
                重置全部
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Progress value={totalProgress.percentage} className="h-3 flex-1" />
            <span className="text-muted-foreground min-w-12 text-right text-sm font-medium tabular-nums">
              {totalProgress.percentage}%
            </span>
          </div>
        </CardHeader>
      </Card>

      {/* 提示信息 */}
      {guide.tips.length > 0 && (
        <Card variant="outline" className="border-yellow-200 dark:border-yellow-800">
          <CardContent className="py-3">
            <div className="text-sm text-yellow-600 dark:text-yellow-400">
              {guide.tips.map((tip, index) => (
                <p key={index}>💡 {tip}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 路线卡片列表 */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">路线</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {guide.routes.map((route) => {
            const progress = getRouteProgress(route)
            return (
              <RouteCard
                key={route.id}
                routeId={route.id}
                name={route.name}
                endingCount={route.endings.length}
                progress={progress}
                onClick={() => router.push(`/guide/${gameId}/${route.id}`)}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
