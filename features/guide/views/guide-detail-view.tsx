'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowLeftIcon, BookOpen, Lightbulb, RotateCcw } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { EditGuide } from '@/features/guide/components/edit-guide'
import { RouteCard } from '@/features/guide/components/route-card'
import { getGuideApi } from '@/features/guide/guide-api'
import { useGuide } from '@/features/guide/hooks/use-guide'

interface GuideDetailViewProps {
  gameId: number
}

// Framer Motion 动画变体配置
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 }, // 每个卡片延迟 0.06 秒出现
  },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 24 },
  },
} as const

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
      <Card variant="default" className="overflow-hidden">
        <CardHeader className="bg-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{guide.name}</CardTitle>
              <CardDescription className="mt-1.5">
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
          <div className="mt-4 flex items-center gap-3">
            <Progress value={totalProgress.percentage} className="h-2.5 flex-1" />
            <span className="text-muted-foreground min-w-10 text-right text-sm font-medium tabular-nums">
              {totalProgress.percentage}%
            </span>
          </div>
        </CardHeader>
      </Card>

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

        {/* 使用 framer-motion 包裹 Grid 容器 */}
        <motion.div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {guide.routes.map((route) => {
            const progress = getRouteProgress(route)
            return (
              // 将每个子卡片作为动画目标
              <motion.div key={route.id} variants={itemVariants}>
                <RouteCard
                  routeId={route.id}
                  name={route.name}
                  endingCount={route.endings.length}
                  progress={progress}
                  onClick={() => router.push(`/guide/${gameId}/${route.id}`)}
                />
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </div>
  )
}
