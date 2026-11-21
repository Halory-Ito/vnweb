'use client'

import { formatHeatmapDayLabel, formatPlayDuration } from '../lib/format-utils'
import { HEATMAP_LEVEL_ALPHAS } from '../lib/heatmap-utils'
import { cn } from '@/lib/utils'

import type { RecordPlayHeatmapDay } from '@/types'

type HeatmapDayCellProps = {
  day: RecordPlayHeatmapDay
  level: number
  color: string
  isToday: boolean
  isSelected: boolean
  onSelect: () => void
}

export default function HeatmapDayCell({
  day,
  level,
  color,
  isToday,
  isSelected,
  onSelect,
}: HeatmapDayCellProps) {
  const dayLabel = formatHeatmapDayLabel(day.date)
  const duration = day.seconds > 0 ? formatPlayDuration(day.seconds) : '无游玩记录'

  return (
    <button
      type="button"
      aria-label={`${dayLabel}，${duration}`}
      aria-current={isToday ? 'date' : undefined}
      aria-pressed={isSelected}
      onClick={onSelect}
      className={cn(
        'relative grid h-full min-h-9 min-w-0 place-items-center rounded-md text-sm tabular-nums hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring sm:min-h-10',
        level === 0 && 'bg-muted text-muted-foreground',
        isSelected && 'ring-foreground ring-2 ring-inset font-semibold',
      )}
      style={
        level > 0 ? { backgroundColor: `${color}${HEATMAP_LEVEL_ALPHAS[level - 1]}` } : undefined
      }
    >
      {Number(day.date.slice(-2))}
      {isToday ? <span className="absolute bottom-1 size-1 rounded-full bg-current" /> : null}
    </button>
  )
}
