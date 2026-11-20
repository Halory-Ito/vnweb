'use client'

import { Disc3, LoaderCircle, Maximize2, Pause, Play, SkipForward, X } from 'lucide-react'

import { LiquidGlassSurface } from './liquid-glass-surface'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import type { usePlayerDrag } from '../hooks/use-player-drag'
import type { useGlobalSongPlayer } from '../hooks/use-song-player'

type PlayerLiquidMiniProps = {
  player: ReturnType<typeof useGlobalSongPlayer>
  drag: ReturnType<typeof usePlayerDrag>
  onExpand: () => void
  onFullscreen: () => void
}

const RING_RADIUS = 17
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

export function PlayerLiquidMini({ player, drag, onExpand, onFullscreen }: PlayerLiquidMiniProps) {
  const selection = player.selection
  if (!selection) return null

  const progress = player.duration > 0 ? Math.min(player.time / player.duration, 1) : 0
  const dashOffset = RING_CIRCUMFERENCE * (1 - progress)
  const ghostClass =
    'rounded-full text-foreground/75 hover:bg-foreground/10 hover:text-foreground dark:text-white/80 dark:hover:bg-white/15 dark:hover:text-white'

  return (
    <div
      ref={drag.panel}
      style={drag.style}
      role="region"
      aria-label="迷你音乐播放器"
      title="长按可拖动位置"
      data-player-form="liquid-glass"
      {...drag.handle}
      className={cn(
        'fixed right-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 max-w-[min(calc(100vw-1.5rem),21.5rem)] rounded-full transition-transform duration-200 sm:right-5 sm:bottom-5',
        drag.isDragging &&
          'scale-[1.03] cursor-grabbing select-none ring-2 ring-white/60 dark:ring-white/35',
      )}
    >
      <LiquidGlassSurface
        cover={selection.album?.cover}
        isPlaying={player.status.isPlaying}
        className="rounded-full"
        contentClassName="flex items-center gap-2 py-1.5 pr-2 pl-2"
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
              className="stroke-foreground/15 dark:stroke-white/15"
              strokeWidth="2"
            />
            <circle
              cx="19"
              cy="19"
              r={RING_RADIUS}
              fill="none"
              className="stroke-foreground transition-[stroke-dashoffset] duration-200 dark:stroke-white dark:drop-shadow-[0_0_4px_rgba(186,230,253,0.7)]"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
            />
          </svg>
          <span
            className={cn(
              'bg-muted/70 flex size-7 items-center justify-center overflow-hidden rounded-full ring-1 ring-white/60 dark:ring-white/25',
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
          <p className="text-foreground truncate text-xs font-semibold">{selection.song.name}</p>
          {selection.album?.name ? (
            <p className="text-foreground/65 truncate text-[11px] dark:text-white/70">
              {selection.album.name}
            </p>
          ) : null}
        </button>

        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={player.status.isBuffering}
            aria-label={player.status.isPlaying ? '暂停' : '播放'}
            onClick={player.toggle}
            className={cn(
              'ost-liquid-orb size-7 rounded-full hover:bg-transparent dark:hover:bg-transparent',
              player.status.isPlaying && 'ost-liquid-orb-playing',
            )}
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
            className={ghostClass}
          >
            <SkipForward className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="展开播放器"
            onClick={onExpand}
            className={ghostClass}
          >
            <Maximize2 className="size-3" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="关闭播放器"
            onClick={player.close}
            className={ghostClass}
          >
            <X className="size-3.5" />
          </Button>
        </div>
      </LiquidGlassSurface>
    </div>
  )
}
