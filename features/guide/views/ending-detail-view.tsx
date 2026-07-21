'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { BookOpen, Lock, Star, Skull, CircleDot } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useRouter } from 'next/navigation'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { EditEnding } from '@/features/guide/components/edit-ending'
import { getEndingApi, getStepsApi, updateGuideProgressApi } from '@/features/guide/guide-api'
import { GuideStep } from '@/features/guide/components/guide-step'
import { useGuideColors } from '@/features/guide/hooks/use-guide-colors'
import { cn } from '@/lib/utils'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
} as const

const stepVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
} as const

const endingTypeConfig: Record<
  string,
  { label: string; icon: React.ReactNode; className: string }
> = {
  true: {
    label: '真结局',
    icon: <Star className="h-3 w-3" />,
    className: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
  },
  bad: {
    label: '坏结局',
    icon: <Skull className="h-3 w-3" />,
    className: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
  },
  normal: {
    label: '普通结局',
    icon: <CircleDot className="h-3 w-3" />,
    className: 'bg-primary/10 text-primary border-primary/20',
  },
}

interface EndingDetailViewProps {
  gameId: number
  routeId: string
  endingId: string
}

export function EndingDetailView({ gameId, routeId, endingId }: EndingDetailViewProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const guideColors = useGuideColors()

  const { data: ending, isLoading: isEndingLoading } = useQuery({
    queryKey: ['ending', endingId],
    queryFn: () => getEndingApi(endingId),
  })

  const { data: steps, isLoading: isStepsLoading } = useQuery({
    queryKey: ['steps', endingId],
    queryFn: () => getStepsApi(endingId),
  })

  if (isEndingLoading || isStepsLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  if (!ending) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <BookOpen className="text-muted-foreground h-10 w-10" />
        <p className="text-muted-foreground text-sm">未找到该结局</p>
      </div>
    )
  }

  const endingProgress = {
    total: (steps || []).length,
    completed: (steps || []).filter((s) => s.finished).length,
    percentage: (steps || []).length > 0
      ? Math.round(((steps || []).filter((s) => s.finished).length / (steps || []).length) * 100)
      : 0,
  }

  const config = endingTypeConfig[ending.type] || endingTypeConfig.normal

  // 切换步骤状态
  const toggleStep = async (stepId: string) => {
    const step = (steps || []).find((s) => s.id === stepId)
    if (!step) return

    const newFinished = !step.finished

    // 乐观更新
    queryClient.setQueryData(['steps', endingId], (old: typeof steps) => {
      if (!old) return old
      return old.map((s) =>
        s.id === stepId ? { ...s, finished: newFinished } : s,
      )
    })

    try {
      await updateGuideProgressApi(gameId, {
        type: 'step',
        id: Number(stepId),
        finished: newFinished,
      })
    } catch {
      // 回滚
      queryClient.invalidateQueries({ queryKey: ['steps', endingId] })
    }
  }

  // 处理步骤分组，相同group只显示一次日期
  const renderStepsWithGroups = () => {
    let lastGroup: string | undefined
    const elements: React.ReactNode[] = []

    ;(steps || []).forEach((step, index) => {
      if (step.group && step.group !== lastGroup) {
        elements.push(
          <div
            key={`group-${step.group}-${index}`}
            className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded mt-2 first:mt-0"
          >
            {step.group}
          </div>
        )
        lastGroup = step.group
      } else if (!step.group) {
        lastGroup = undefined
      }

      elements.push(
        <GuideStep
          key={step.id}
          step={step}
          isCompleted={!!step.finished}
          onToggle={() => toggleStep(step.id)}
        />
      )
    })

    return elements
  }

  return (
    <motion.div
      className="max-h-[calc(100vh-144px)] w-full space-y-4 overflow-y-auto p-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* 返回按钮 */}
      <motion.div variants={itemVariants}>
        <Button variant="ghost" size="sm" onClick={() => router.push(`/guide/${gameId}/${routeId}`)}>
          ← 返回路线
        </Button>
      </motion.div>

      {/* 结局信息 */}
      <motion.div variants={itemVariants}>
        <Card variant="default">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle>{ending.name}</CardTitle>
                <Badge variant="outline" className={cn('text-xs gap-1', config.className)}>
                  {config.icon}
                  {config.label}
                </Badge>
              </div>
              <EditEnding endingId={endingId} gameId={gameId} />
            </div>
            <CardDescription>
              {endingProgress.completed}/{endingProgress.total} 步骤完成
            </CardDescription>
            <div className="flex items-center gap-3">
              <Progress value={endingProgress.percentage} className="h-3 flex-1" />
              <span className="text-muted-foreground min-w-12 text-right text-sm font-medium tabular-nums">
                {endingProgress.percentage}%
              </span>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* 开启条件 */}
      <AnimatePresence>
        {ending.requirements && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-start gap-2 rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-400">
              <Lock className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="font-medium">开启条件：</span>
              <span>{ending.requirements}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 颜色提示 */}
      <motion.div variants={itemVariants}>
        <Card variant="outline">
          <CardContent className="py-3">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: guideColors.choice }} />
                <span className="text-foreground">选项</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: guideColors.save }} />
                <span className="text-foreground">保存</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: guideColors.load }} />
                <span className="text-foreground">读取</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: guideColors.note }} />
                <span className="text-foreground">备注</span>
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 步骤列表 */}
      <motion.div className="space-y-2" variants={containerVariants}>
        {renderStepsWithGroups().map((element, index) => (
          <motion.div key={index} variants={stepVariants}>
            {element}
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}
