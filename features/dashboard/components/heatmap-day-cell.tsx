'use client'

import { formatHeatmapDayLabel, formatPlayDuration } from '../lib/format-utils'
import { HEATMAP_LEVEL_ALPHAS } from '../lib/heatmap-utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

import type { RecordPlayHeatmapDay } from '@/types'

type HeatmapDayCellProps = {
  day: RecordPlayHeatmapDay
  level: number
  color: string
  isToday: boolean
}

export default function HeatmapDayCell({ day, level, color, isToday }: HeatmapDayCellProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'flex aspect-square items-center justify-center rounded-md text-xs tabular-nums transition-colors sm:text-sm',
            level === 0
              ? 'bg-muted text-muted-foreground'
              : level >= 3
                ? 'text-white'
                : 'text-foreground',
            isToday && 'ring-primary ring-2 ring-offset-1 ring-offset-background',
          )}
          style={
            level > 0
              ? { backgroundColor: `${color}${HEATMAP_LEVEL_ALPHAS[level - 1]}` }
              : undefined
          }
        >
          {Number(day.date.slice(-2))}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top">
        <div>{formatHeatmapDayLabel(day.date)}</div>
        <div>{day.seconds > 0 ? formatPlayDuration(day.seconds) : '无游玩记录'}</div>
      </TooltipContent>
    </Tooltip>
  )
}
