'use client'

import { Disc3, LoaderCircle, Maximize2, Pause, Play, SkipForward, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import type { usePlayerDrag } from '../hooks/use-player-drag'
import type { useGlobalSongPlayer } from '../hooks/use-song-player'

type PlayerMiniBarProps = {
  player: ReturnType<typeof useGlobalSongPlayer>
  drag: ReturnType<typeof usePlayerDrag>
  onExpand: () => void
  onFullscreen: () => void
}

const RING_RADIUS = 17
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

export function PlayerMiniBar({ player, drag, onExpand, onFullscreen }: PlayerMiniBarProps) {
  const selection = player.selection
  if (!selection) return null

  const progress = player.duration > 0 ? Math.min(player.time / player.duration, 1) : 0
  const dashOffset = RING_CIRCUMFERENCE * (1 - progress)

  return (
    <div
      ref={drag.panel}
      style={drag.style}
      role="region"
      aria-label="迷你音乐播放器"
      title="长按可拖动位置"
      data-player-form="classic"
      {...drag.handle}
      className={cn(
        'bg-background/85 fixed right-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 flex max-w-[min(calc(100vw-1.5rem),21rem)] items-center gap-2 rounded-full border py-1.5 pr-2 pl-2 shadow-[0_12px_36px_-10px_rgba(0,0,0,0.28)] backdrop-blur-2xl transition-[box-shadow,transform] duration-150 sm:right-5 sm:bottom-5',
        drag.isDragging && 'ring-primary/35 scale-[1.03] cursor-grabbing select-none ring-2',
      )}
    >
      <button
        type="button"
        onClick={onFullscreen}
        aria-label="展开全屏播放器"
        className="relative flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 38 38"
          className="pointer-events-none absolute inset-0 size-9 -rotate-90"
        >
          <circle
            cx="19"
            cy="19"
            r={RING_RADIUS}
            fill="none"
            className="stroke-foreground/15"
            strokeWidth="2"
          />
          <circle
            cx="19"
            cy="19"
            r={RING_RADIUS}
            fill="none"
            className="stroke-primary transition-[stroke-dashoffset] duration-200"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <span
          className={cn(
            'bg-muted flex size-7 items-center justify-center overflow-hidden rounded-full',
            player.status.isPlaying && 'motion-safe:animate-[spin_14s_linear_infinite]',
          )}
        >
          {selection.album?.cover ? (
            <img src={selection.album.cover} alt="" className="size-full object-cover" />
          ) : (
            <Disc3 className="text-muted-foreground size-4" aria-hidden="true" />
          )}
        </span>
      </button>

      <button
        type="button"
        onClick={onExpand}
        className="min-w-0 flex-1 cursor-pointer text-left"
        title={selection.song.name}
      >
        <p className="truncate text-xs font-semibold">{selection.song.name}</p>
        {selection.album?.name ? (
          <p className="text-muted-foreground truncate text-[11px]">{selection.album.name}</p>
        ) : null}
      </button>

      <div className="flex shrink-0 items-center gap-0.5">
        <Button
          type="button"
          size="icon-xs"
          disabled={player.status.isBuffering}
          aria-label={player.status.isPlaying ? '暂停' : '播放'}
          onClick={player.toggle}
          className="rounded-full"
        >
          {player.status.isBuffering ? (
            <LoaderCircle className="size-3.5 animate-spin" />
          ) : player.status.isPlaying ? (
            <Pause className="size-3.5 fill-current" />
          ) : (
            <Play className="size-3.5 translate-x-[0.5px] fill-current" />
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="下一首"
          onClick={() => player.move(1)}
          className="rounded-full"
        >
          <SkipForward className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="展开播放器"
          onClick={onExpand}
          className="rounded-full"
        >
          <Maximize2 className="size-3" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="关闭播放器"
          onClick={player.close}
          className="text-muted-foreground hover:text-foreground rounded-full"
        >
          <X className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}
