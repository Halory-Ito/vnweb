'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { BookOpen, Lock, Star, Skull, CircleDot, ArrowLeftIcon, Eye, EyeOff } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CompleteAllButton } from '@/features/guide/components/complete-all-botton'
import { EditEnding } from '@/features/guide/components/edit-ending'
import { GuideDetailHeader } from '@/features/guide/components/guide-detail-header'
import { GuideStep } from '@/features/guide/components/guide-step'
import { ResetAllButton } from '@/features/guide/components/reset-all-botton'
import { containerVariants, itemVariants } from '@/features/guide/data/motion'
import { getEndingApi, getStepsApi, updateGuideProgressApi } from '@/features/guide/guide-api'
import { useGuideColors } from '@/features/guide/hooks/use-guide-colors'
import { cn } from '@/lib/utils'

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
  const [hideCompleted, setHideCompleted] = useState(false)

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
    percentage:
      (steps || []).length > 0
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
      return old.map((s) => (s.id === stepId ? { ...s, finished: newFinished } : s))
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

  // 重置结局进度
  const handleResetEnding = async () => {
    try {
      await updateGuideProgressApi(gameId, {
        type: 'ending',
        id: Number(endingId),
        finished: false,
      })
      queryClient.invalidateQueries({ queryKey: ['ending', endingId] })
      queryClient.invalidateQueries({ queryKey: ['steps', endingId] })
      queryClient.invalidateQueries({ queryKey: ['guide'] })
      toast.success('结局进度已重置')
    } catch {
      toast.error('重置结局进度失败')
    }
  }

  // 标记结局全部完成
  const handleCompleteEnding = async () => {
    try {
      await updateGuideProgressApi(gameId, {
        type: 'ending',
        id: Number(endingId),
        finished: true,
      })
      queryClient.invalidateQueries({ queryKey: ['ending', endingId] })
      queryClient.invalidateQueries({ queryKey: ['steps', endingId] })
      queryClient.invalidateQueries({ queryKey: ['guide'] })
      toast.success('结局已全部标记完成')
    } catch {
      toast.error('标记结局完成失败')
    }
  }

  // 处理步骤分组，相同group只显示一次日期
  const renderStepsWithGroups = () => {
    let lastGroup: string | undefined
    const elements: React.ReactNode[] = []

    const filteredSteps = hideCompleted
      ? (steps || []).filter((step) => !step.finished)
      : steps || []

    filteredSteps.forEach((step, index) => {
      if (step.group && step.group !== lastGroup) {
        elements.push(
          <div
            key={`group-${step.group}-${index}`}
            className="text-primary bg-primary/10 mt-2 rounded px-2 py-1 text-xs font-medium first:mt-0"
          >
            {step.group}
          </div>,
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
        />,
      )
    })

    return elements
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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/guide/${gameId}/${routeId}`)}
        >
          <ArrowLeftIcon className="mr-1 h-4 w-4" /> 返回结局
        </Button>
      </motion.div>

      {/* 结局信息 */}
      <motion.div variants={itemVariants}>
        <GuideDetailHeader
          title={
            <div className="flex items-center gap-2">
              {ending.name}
              <Badge variant="outline" className={cn('text-xs gap-1', config.className)}>
                {config.icon}
                {config.label}
              </Badge>
            </div>
          }
          description={`${endingProgress.completed}/${endingProgress.total} 步骤完成`}
          progress={endingProgress}
          actions={
            <>
              <EditEnding endingId={endingId} gameId={gameId} />
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setHideCompleted(!hideCompleted)}
              >
                {hideCompleted ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
              <ResetAllButton
                title="重置结局进度"
                description="确定要重置该结局的所有进度吗？此操作将清除该结局下所有步骤的完成状态。"
                onConfirm={handleResetEnding}
                disabled={endingProgress.completed === 0}
                buttonTitle="重置结局"
              />
              <CompleteAllButton
                title="标记结局全部完成"
                description="确定要将该结局的所有步骤标记为已完成吗？"
                onConfirm={handleCompleteEnding}
                disabled={endingProgress.completed === endingProgress.total}
                buttonTitle="标记结局全部完成"
              />
            </>
          }
        />
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
              <span className="min-w-1/4 font-medium">开启条件：</span>
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
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: guideColors.choice }}
                />
                <span className="text-foreground">选项</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: guideColors.save }}
                />
                <span className="text-foreground">保存</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: guideColors.load }}
                />
                <span className="text-foreground">读取</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: guideColors.note }}
                />
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
