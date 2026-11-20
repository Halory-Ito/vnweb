'use client'

import { AudioLines, Pause, Play } from 'lucide-react'

import { cn } from '@/lib/utils'

import type { OstSongItem } from '@/types'

type PlayerQueueProps = {
  items: OstSongItem[]
  currentSongId: number
  isPlaying: boolean
  onSelect: (song: OstSongItem) => void
  variant?: 'compact' | 'immersive'
}

export function PlayerQueue({
  items,
  currentSongId,
  isPlaying,
  onSelect,
  variant = 'compact',
}: PlayerQueueProps) {
  const immersive = variant === 'immersive'

  return (
    <div
      role="region"
      aria-label="待播队列"
      className={cn(
        'overflow-y-auto overscroll-contain',
        immersive ? 'h-full max-h-[62dvh] space-y-1 pr-1' : 'max-h-[min(32dvh,13rem)] space-y-0.5 px-1.5 py-2',
      )}
    >
      {items.map((item, index) => {
        const isCurrent = item.id === currentSongId
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item)}
            className={cn(
              'group flex w-full cursor-pointer items-center gap-3 rounded-xl px-2.5 text-left transition-colors',
              immersive ? 'py-2.5' : 'py-1.5',
              isCurrent
                ? 'bg-primary/10 text-primary'
                : 'text-foreground/85 hover:bg-accent/60',
            )}
          >
            <span className="flex size-5 shrink-0 items-center justify-center text-xs tabular-nums">
              {isCurrent ? (
                isPlaying ? (
                  <AudioLines className="size-3.5 animate-pulse" />
                ) : (
                  <Pause className="size-3.5" />
                )
              ) : (
                <>
                  <span className="text-muted-foreground group-hover:hidden">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <Play className="hidden size-3 fill-current group-hover:block" />
                </>
              )}
            </span>
            <span
              className={cn(
                'min-w-0 flex-1 truncate',
                immersive ? 'text-sm font-medium' : 'text-xs font-medium',
              )}
              title={item.name}
            >
              {item.name}
            </span>
          </button>
        )
      })}
    </div>
  )
}
