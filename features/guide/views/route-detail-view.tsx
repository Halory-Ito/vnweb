'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeftIcon, BookOpen } from 'lucide-react'
import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { CompleteAllButton } from '@/features/guide/components/complete-all-botton'
import { EditRoute } from '@/features/guide/components/edit-route'
import { EndingCard } from '@/features/guide/components/ending-card'
import { GuideDetailHeader } from '@/features/guide/components/guide-detail-header'
import { ResetAllButton } from '@/features/guide/components/reset-all-botton'
import { containerVariants, itemVariants, cardVariants } from '@/features/guide/data/motion'
import { getRouteApi, getEndingsApi, updateGuideProgressApi } from '@/features/guide/guide-api'

interface RouteDetailViewProps {
  gameId: number
  routeId: string
}

export function RouteDetailView({ gameId, routeId }: RouteDetailViewProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

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

  // 重置路线进度
  const handleResetRoute = async () => {
    try {
      await updateGuideProgressApi(gameId, {
        type: 'route',
        id: Number(routeId),
        finished: false,
      })
      queryClient.invalidateQueries({ queryKey: ['route', routeId] })
      queryClient.invalidateQueries({ queryKey: ['endings', routeId] })
      queryClient.invalidateQueries({ queryKey: ['guide'] })
      toast.success('路线进度已重置')
    } catch {
      toast.error('重置路线进度失败')
    }
  }

  // 标记路线全部完成
  const handleCompleteRoute = async () => {
    try {
      await updateGuideProgressApi(gameId, {
        type: 'route',
        id: Number(routeId),
        finished: true,
      })
      queryClient.invalidateQueries({ queryKey: ['route', routeId] })
      queryClient.invalidateQueries({ queryKey: ['endings', routeId] })
      queryClient.invalidateQueries({ queryKey: ['guide'] })
      toast.success('路线已全部标记完成')
    } catch {
      toast.error('标记路线完成失败')
    }
  }

  return (
    <motion.div
      className="max-h-[calc(100vh-70px)] w-full space-y-4 overflow-y-auto p-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* 返回按钮 */}
      <motion.div variants={itemVariants}>
        <Button variant="ghost" size="sm" onClick={() => router.push(`/guide/${gameId}`)}>
          <ArrowLeftIcon className="mr-1 h-4 w-4" /> 返回攻略
        </Button>
      </motion.div>

      {/* 路线信息 */}
      <motion.div variants={itemVariants}>
        <GuideDetailHeader
          title={route.name}
          description={`${(endings || []).length} 个结局 · ${routeProgress.completed}/${routeProgress.total} 步骤完成`}
          progress={routeProgress}
          actions={
            <>
              <EditRoute routeId={routeId} />
              <ResetAllButton
                title="重置路线进度"
                description="确定要重置该路线的所有进度吗？此操作将清除该路线下所有结局和步骤的完成状态。"
                onConfirm={handleResetRoute}
                disabled={routeProgress.completed === 0}
                buttonTitle="重置路线"
              />
              <CompleteAllButton
                title="标记路线全部完成"
                description="确定要将该路线的所有步骤标记为已完成吗？"
                onConfirm={handleCompleteRoute}
                disabled={routeProgress.completed === routeProgress.total}
                buttonTitle="标记路线全部完成"
              />
            </>
          }
        />
      </motion.div>

      {/* 结局卡片列表 */}
      <motion.div className="space-y-2" variants={itemVariants}>
        <h2 className="text-lg font-semibold">结局</h2>
        <motion.div className="grid grid-cols-1 gap-4 lg:grid-cols-2" variants={containerVariants}>
          {(endings || []).map((ending) => {
            const progress = getEndingProgress(ending)
            return (
              <motion.div key={ending.id} variants={cardVariants} className="h-full w-full">
                <EndingCard
                  name={ending.name}
                  type={ending.type}
                  cover={ending.cover}
                  progress={progress}
                  onClick={() => router.push(`/guide/${gameId}/${routeId}/${ending.id}`)}
                />
              </motion.div>
            )
          })}
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
