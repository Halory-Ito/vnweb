'use client'

import { useQuery } from '@tanstack/react-query'
import { ArrowLeftIcon, BookOpen, Lightbulb } from 'lucide-react'
import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { CompleteAllButton } from '@/features/guide/components/complete-all-botton'
import { EditGuide } from '@/features/guide/components/edit-guide'
import { GuideDetailHeader } from '@/features/guide/components/guide-detail-header'
import { ResetAllButton } from '@/features/guide/components/reset-all-botton'
import { RouteCard } from '@/features/guide/components/route-card'
import { containerVariants, itemVariants, cardVariants } from '@/features/guide/data/motion'
import { getGuideApi } from '@/features/guide/guide-api'
import { useGuide } from '@/features/guide/hooks/use-guide'
import { useRouteSort } from '@/features/guide/hooks/use-route-sort'
import { cn } from '@/lib/utils'

interface GuideDetailViewProps {
  gameId: number
}

export function GuideDetailView({ gameId }: GuideDetailViewProps) {
  const router = useRouter()

  const { data: guide, isLoading } = useQuery({
    queryKey: ['guide', gameId],
    queryFn: () => getGuideApi(gameId),
  })

  const { getRouteProgress, getTotalProgress, resetProgress, completeProgress } = useGuide(
    guide ?? null,
    gameId,
  )

  const {
    routes,
    dragIndex,
    dragOverIndex,
    handleDragStart,
    handleDragOver,
    handleDragEnter,
    handleDrop,
    handleDragEnd,
  } = useRouteSort(gameId, guide?.routes)

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
    <motion.div
      className="max-h-[100cqh] w-full space-y-5 overflow-y-auto p-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* 返回按钮 */}
      <motion.div variants={itemVariants}>
        <Button variant="ghost" size="sm" onClick={() => router.push(`/guide`)}>
          <ArrowLeftIcon className="mr-1 h-4 w-4" /> 返回列表
        </Button>
      </motion.div>

      {/* 攻略总览信息 */}
      <motion.div variants={itemVariants}>
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
      </motion.div>

      {/* 提示信息 - 优化为紧凑的 Alert 样式 */}
      {guide.tips.length > 0 && (
        <motion.div
          className="flex flex-col gap-1.5 rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-700 dark:text-yellow-400"
          variants={itemVariants}
        >
          {guide.tips.map((tip, index) => (
            <div key={index} className="flex items-start gap-2">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500/80" />
              <span className="leading-relaxed">{tip}</span>
            </div>
          ))}
        </motion.div>
      )}

      {/* 路线卡片列表 */}
      <motion.div className="space-y-3" variants={itemVariants}>
        <h2 className="text-lg font-semibold tracking-tight">路线分支</h2>

        {/* 拖拽排序网格 */}
        <motion.div
          className="grid gap-4 sm:grid-cols-1 lg:grid-cols-4"
          variants={containerVariants}
        >
          {routes.map((route, index) => {
            const progress = getRouteProgress(route)
            const isDragging = dragIndex === index
            const isDragOver = dragOverIndex === index
            return (
              <motion.div key={route.id} variants={cardVariants} layout className="h-full w-full">
                <div
                  className={cn(
                    'h-full w-full rounded-xl transition-all',
                    isDragging && 'opacity-50',
                    isDragOver && !isDragging && 'ring-primary ring-2',
                  )}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnter={(e) => handleDragEnter(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  <RouteCard
                    routeId={route.id}
                    name={route.name}
                    endingCount={route.endings.length}
                    progress={progress}
                    onClick={() => router.push(`/guide/${gameId}/${route.id}`)}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnd={handleDragEnd}
                  />
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
