'use client'

import { ChevronRight, CircleCheckIcon, GripVertical } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  getGuideProgressColor,
  GUIDE_COMPLETED_BADGE_CLASS,
  GUIDE_COMPLETED_CARD_CLASS,
  GUIDE_PROGRESS_BAR_CLASS,
} from '@/features/guide/lib/guide-progress'
import { cn } from '@/lib/utils'

interface RouteCardProps {
  routeId: string
  name: string
  endingCount: number
  progress: {
    total: number
    completed: number
    percentage: number
  }
  onClick?: () => void
  onDragStart?: (e: React.DragEvent) => void
  onDragEnd?: (e: React.DragEvent) => void
}

export function RouteCard({
  name,
  endingCount,
  progress,
  onClick,
  onDragStart,
  onDragEnd,
}: RouteCardProps) {
  const isCompleted = progress.percentage >= 100
  const isNotStarted = progress.percentage === 0
  const progressColor = getGuideProgressColor(progress.percentage)

  return (
    <Card
      variant="outline"
      onClick={onClick}
      draggable={!!onDragStart}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        'group relative overflow-hidden transition-all duration-300',
        // 优化悬停时的浮动幅度和阴影
        'hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg dark:hover:shadow-primary/10',
        // 100% 状态给予明显的完成反馈
        isCompleted && GUIDE_COMPLETED_CARD_CLASS,
        // 0% 状态降低整体视觉权重
        isNotStarted && 'opacity-80 hover:opacity-100',
        // 可拖拽状态
        onDragStart && 'cursor-grab active:cursor-grabbing',
      )}
    >
      {/* 拖拽手柄 */}
      {onDragStart && (
        <div
          className="text-muted-foreground/50 hover:text-muted-foreground absolute top-1/2 left-1 -translate-y-1/2 cursor-grab opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
          onMouseDown={(e) => {
            e.stopPropagation()
          }}
        >
          <GripVertical className="h-4 w-4" />
        </div>
      )}
      <CardContent className="px-4 py-3">
        <div className="space-y-2">
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <h3
              className={cn(
                'truncate text-base font-semibold leading-5 transition-colors',
                isNotStarted ? 'text-muted-foreground' : 'text-foreground',
                onDragStart && 'pl-3',
              )}
            >
              {name}
            </h3>

            <div className="flex shrink-0 items-center gap-1.5">
              <Badge
                variant={isCompleted ? 'outline' : 'secondary'}
                className={cn(
                  'rounded-md px-2 py-0 text-[10px] font-medium tracking-wide uppercase',
                  isCompleted && GUIDE_COMPLETED_BADGE_CLASS,
                )}
              >
                {endingCount} END
              </Badge>
              {/* 引导箭头：默认透明并左移，Hover时滑入并显现 */}
              <ChevronRight className="text-muted-foreground text-opacity-0 h-4 w-4 -translate-x-2 opacity-0 transition-all duration-300 group-hover:-translate-x-0 group-hover:opacity-100" />
            </div>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-3">
            <Progress
              value={progress.percentage}
              className={cn('h-2 flex-1 rounded-full', GUIDE_PROGRESS_BAR_CLASS, progressColor)}
            />

            {isCompleted ? (
              <span
                className={cn(
                  'inline-flex shrink-0 items-center gap-1 text-xs font-medium',
                  progressColor,
                )}
              >
                <CircleCheckIcon aria-hidden="true" className="size-3.5" />
                已完成
              </span>
            ) : (
              <span
                className={cn('w-10 text-right text-xs font-medium tabular-nums', progressColor)}
              >
                {progress.percentage}%
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
