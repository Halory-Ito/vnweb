'use client'

import { CircleCheckIcon } from 'lucide-react'

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  getGuideProgressColor,
  GUIDE_COMPLETED_CARD_CLASS,
  GUIDE_PROGRESS_BAR_CLASS,
} from '@/features/guide/lib/guide-progress'
import { cn } from '@/lib/utils'

interface GuideDetailHeaderProps {
  /** 标题 */
  title: React.ReactNode
  /** 描述信息 */
  description: string
  /** 进度信息 */
  progress: {
    completed: number
    total: number
    percentage: number
  }
  /** 操作按钮 */
  actions?: React.ReactNode
  /** 自定义类名 */
  className?: string
}

export function GuideDetailHeader({
  title,
  description,
  progress,
  actions,
  className,
}: GuideDetailHeaderProps) {
  const isCompleted = progress.percentage >= 100
  const progressColor = getGuideProgressColor(progress.percentage)

  return (
    <Card
      variant="outline"
      className={cn('overflow-hidden', isCompleted && GUIDE_COMPLETED_CARD_CLASS, className)}
    >
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>
            <CardDescription className="text-sm">{description}</CardDescription>
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Progress
            value={progress.percentage}
            className={cn('h-2.5 flex-1 sm:h-3', GUIDE_PROGRESS_BAR_CLASS, progressColor)}
          />
          {isCompleted ? (
            <span
              className={cn(
                'inline-flex shrink-0 items-center gap-1 text-sm font-medium',
                progressColor,
              )}
            >
              <CircleCheckIcon aria-hidden="true" className="size-4" />
              已完成
            </span>
          ) : (
            <span
              className={cn(
                'min-w-10 text-right text-sm font-medium tabular-nums sm:min-w-12',
                progressColor,
              )}
            >
              {progress.percentage}%
            </span>
          )}
        </div>
      </CardHeader>
    </Card>
  )
}
