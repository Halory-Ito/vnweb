'use client'

import { Play } from 'lucide-react'

import { formatPlayerTime } from '../../lib/play-mode'

export function CueTimePill({ time }: { time: number }) {
  return (
    <span
      aria-hidden="true"
      className="bg-background/80 text-muted-foreground inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] tabular-nums opacity-0 backdrop-blur-xs transition-opacity group-hover/cue:opacity-100"
    >
      <Play className="size-2.5 fill-current" />
      {formatPlayerTime(time)}
    </span>
  )
}
