'use client'

import { formatPlayerTime } from '../lib/play-mode'
import { PlayerSlider } from './player-slider'
import { cn } from '@/lib/utils'

import type { PlayerFormId } from '../lib/player-forms'

type PlayerProgressProps = {
  time: number
  duration: number
  onSeek: (value: number) => void
  layout?: 'inline' | 'stacked'
  form?: PlayerFormId
}

export function PlayerProgress({
  time,
  duration,
  onSeek,
  layout = 'inline',
  form = 'classic',
}: PlayerProgressProps) {
  const isLiquid = form === 'liquid-glass'
  const timeTextClass = isLiquid ? 'text-foreground/65 dark:text-white/70' : 'text-muted-foreground'

  const slider = (
    <PlayerSlider
      form={form}
      aria-label="播放进度"
      max={duration || 1}
      step={0.1}
      disabled={!duration}
      value={[Math.min(time, duration)]}
      onValueChange={([value]) => onSeek(value)}
    />
  )

  if (layout === 'stacked') {
    return (
      <div className="w-full">
        {slider}
        <div
          className={cn(
            'mt-0.5 flex items-center justify-between text-xs tabular-nums',
            timeTextClass,
          )}
        >
          <span>{formatPlayerTime(time)}</span>
          <span>{formatPlayerTime(duration)}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2.5 text-[11px] tabular-nums">
      <span className={cn('w-8 text-right', timeTextClass)}>{formatPlayerTime(time)}</span>
      {slider}
      <span className={cn('w-8', timeTextClass)}>{formatPlayerTime(duration)}</span>
    </div>
  )
}
