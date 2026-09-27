'use client'

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
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
  actions: React.ReactNode
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
  return (
    <Card variant="default" className={cn('overflow-hidden', className)}>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>
            <CardDescription className="text-sm">{description}</CardDescription>
          </div>
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Progress value={progress.percentage} className="h-2.5 flex-1 sm:h-3" />
          <span className="text-muted-foreground min-w-10 text-right text-sm font-medium tabular-nums sm:min-w-12">
            {progress.percentage}%
          </span>
        </div>
      </CardHeader>
    </Card>
  )
}
