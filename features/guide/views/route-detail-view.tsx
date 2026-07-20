'use client'

import { useQuery } from '@tanstack/react-query'
import { BookOpen, RotateCcw } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { EndingCard } from '@/features/guide/components/ending-card'
import { EditRoute } from '@/features/guide/components/edit-route'
import { getRouteApi, getEndingsApi } from '@/features/guide/guide-api'

interface RouteDetailViewProps {
  gameId: number
  routeId: string
}

export function RouteDetailView({ gameId, routeId }: RouteDetailViewProps) {
  const router = useRouter()

  const { data: route, isLoading: isRouteLoading } = useQuery({
    queryKey: ['route', routeId],
    queryFn: () => getRouteApi(routeId),
  })

  const { data: endings, isLoading: isEndingsLoading } = useQuery({
    queryKey: ['endings', routeId],
    queryFn: () => getEndingsApi(routeId),
  })

  if (isRouteLoading || isEndingsLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  if (!route) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <BookOpen className="text-muted-foreground h-10 w-10" />
        <p className="text-muted-foreground text-sm">未找到该路线</p>
      </div>
    )
  }

  // 计算路线进度
  const totalSteps = (endings || []).reduce((sum, ending) => sum + ending.steps.length, 0)
  const completedSteps = (endings || []).reduce(
    (sum, ending) => sum + ending.steps.filter((s) => s.finished).length,
    0,
  )
  const routeProgress = {
    total: totalSteps,
    completed: completedSteps,
    percentage: totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0,
  }

  // 计算结局进度
  const getEndingProgress = (ending: { steps: { finished?: boolean }[] }) => {
    const total = ending.steps.length
    const completed = ending.steps.filter((s) => s.finished).length
    return {
      total,
      completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    }
  }

  // 重置路线进度（本地状态）
  const handleResetRoute = async () => {
    // TODO: 调用重置API
    console.log('重置路线进度:', routeId)
  }

  return (
    <div className="max-h-[calc(100vh-144px)] w-full space-y-4 overflow-y-auto p-4">
      {/* 返回按钮 */}
      <Button variant="ghost" size="sm" onClick={() => router.push(`/guide/${gameId}`)}>
        ← 返回路线
      </Button>

      {/* 路线信息 */}
      <Card variant="default">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{route.name}</CardTitle>
              <CardDescription>
                {(endings || []).length} 个结局 · {routeProgress.completed}/{routeProgress.total}{' '}
                步骤完成
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <EditRoute routeId={routeId} />
              <Button variant="outline" size="sm" onClick={handleResetRoute}>
                <RotateCcw className="mr-2 h-4 w-4" />
                重置路线
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Progress value={routeProgress.percentage} className="h-3 flex-1" />
            <span className="text-muted-foreground min-w-12 text-right text-sm font-medium tabular-nums">
              {routeProgress.percentage}%
            </span>
          </div>
        </CardHeader>
      </Card>

      {/* 结局卡片列表 */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">结局</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(endings || []).map((ending) => {
            const progress = getEndingProgress(ending)
            return (
              <EndingCard
                key={ending.id}
                name={ending.name}
                type={ending.type}
                cover={ending.cover}
                progress={progress}
                onClick={() => router.push(`/guide/${gameId}/${routeId}/${ending.id}`)}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
