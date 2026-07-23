'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeftIcon, BookOpen, Lightbulb } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { CompleteAllButton } from '@/features/guide/components/complete-all-botton'
import { EditGuide } from '@/features/guide/components/edit-guide'
import { GuideDetailHeader } from '@/features/guide/components/guide-detail-header'
import { ResetAllButton } from '@/features/guide/components/reset-all-botton'
import { RouteCard } from '@/features/guide/components/route-card'
import { getGuideApi, updateRouteSortApi } from '@/features/guide/guide-api'
import { GuideRouteWithProgress } from '@/features/guide/guide-api'
import { useGuide } from '@/features/guide/hooks/use-guide'

interface GuideDetailViewProps {
  gameId: number
}

export function GuideDetailView({ gameId }: GuideDetailViewProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: guide, isLoading } = useQuery({
    queryKey: ['guide', gameId],
    queryFn: () => getGuideApi(gameId),
  })

  const { getRouteProgress, getTotalProgress, resetProgress, completeProgress } = useGuide(
    guide ?? null,
    gameId,
  )

  // 本地排序状态
  const [routes, setRoutes] = useState<GuideRouteWithProgress[]>([])

  // 当 guide 数据加载时，同步本地状态
  useEffect(() => {
    if (guide?.routes) {
      setRoutes(guide.routes)
    }
  }, [guide?.routes])

  // 更新排序的 mutation
  const updateSortMutation = useMutation({
    mutationFn: updateRouteSortApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guide', gameId] })
    },
  })

  // 拖拽状态
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // 处理拖拽开始
  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index)
  }, [])

  // 处理拖拽进入
  const handleDragEnter = useCallback((index: number) => {
    setDragOverIndex(index)
  }, [])

  // 处理拖拽结束
  const handleDragEnd = useCallback(() => {
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      const newRoutes = [...routes]
      const [draggedItem] = newRoutes.splice(dragIndex, 1)
      newRoutes.splice(dragOverIndex, 0, draggedItem)

      setRoutes(newRoutes)

      // 更新排序到数据库
      const sortData = newRoutes.map((route, index) => ({
        id: Number(route.id),
        sortOrder: index,
      }))
      updateSortMutation.mutate(sortData)
    }

    setDragIndex(null)
    setDragOverIndex(null)
  }, [dragIndex, dragOverIndex, routes, updateSortMutation])

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground animate-pulse text-sm">加载数据中...</div>
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
    <div className="scrollbar-thin scrollbar-thumb-secondary max-h-[calc(100vh-72px)] w-full space-y-5 overflow-y-auto p-4">
      {/* 返回按钮 */}
      <Button variant="ghost" size="sm" onClick={() => router.push(`/guide`)} className="-ml-2">
        <ArrowLeftIcon className="mr-1 h-4 w-4" />
        返回攻略
      </Button>

      {/* 攻略总览信息 */}
      <GuideDetailHeader
        title={guide.name}
        description={`${totalProgress.completed}/${totalProgress.total} 步骤完成`}
        progress={totalProgress}
        actions={
          <>
            <EditGuide gameId={gameId} />
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
              buttonTitle="标记全部"
            />
          </>
        }
      />

      {/* 提示信息 - 优化为紧凑的 Alert 样式 */}
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

      {/* 路线卡片列表 */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">路线分支</h2>

        {/* 拖拽排序网格 */}
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-4">
          {routes.map((route, index) => {
            const progress = getRouteProgress(route)
            const isDragging = dragIndex === index
            const isDragOver = dragOverIndex === index
            return (
              <div
                key={route.id}
                className={isDragOver && !isDragging ? 'ring-primary rounded-lg ring-2' : ''}
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={() => handleDragEnter(index)}
                onDragEnd={handleDragEnd}
              >
                <RouteCard
                  routeId={route.id}
                  name={route.name}
                  endingCount={route.endings.length}
                  progress={progress}
                  onClick={() => router.push(`/guide/${gameId}/${route.id}`)}
                  onDragStart={() => handleDragStart(index)}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
