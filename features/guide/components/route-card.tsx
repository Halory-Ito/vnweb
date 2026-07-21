'use client'

import { ChevronRight } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
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
}

export function RouteCard({ name, endingCount, progress, onClick }: RouteCardProps) {
  const isCompleted = progress.percentage === 100
  const isNotStarted = progress.percentage === 0

  return (
    <Card
      variant="outline"
      onClick={onClick}
      className={cn(
        'group cursor-pointer overflow-hidden transition-all duration-300',
        // 优化悬停时的浮动幅度和阴影
        'hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg dark:hover:shadow-primary/10',
        // 100% 状态给予微弱的背景色反馈
        isCompleted && 'border-primary/20 bg-primary/5',
        // 0% 状态降低整体视觉权重
        isNotStarted && 'opacity-80 hover:opacity-100',
      )}
    >
      <CardContent className="px-4 py-3">
        <div className="space-y-2">
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <h3
              className={cn(
                'truncate text-base font-semibold leading-5 transition-colors',
                isNotStarted ? 'text-muted-foreground' : 'text-foreground',
              )}
            >
              {name}
            </h3>

            <div className="flex shrink-0 items-center gap-1.5">
              <Badge
                variant={isCompleted ? 'default' : 'secondary'}
                className="rounded-md px-2 py-0 text-[10px] font-medium tracking-wide uppercase"
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
              className={cn(
                'h-2 flex-1 rounded-full',
                isNotStarted && 'bg-secondary/50 dark:bg-secondary/30', // 弱化未开始状态的轨道底色
              )}
            />

            <span
              className={cn(
                'w-10 text-right tabular-nums text-xs font-medium',
                isCompleted ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              {progress.percentage}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
