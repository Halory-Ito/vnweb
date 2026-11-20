'use client'

import { LoaderCircle, Pause, Play, SkipBack, SkipForward } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import type { PlayerFormId } from '../lib/player-forms'

type PlayerTransportProps = {
  isPlaying: boolean
  isBuffering: boolean
  onToggle: () => void
  onPrev: () => void
  onNext: () => void
  size?: 'sm' | 'lg'
  form?: PlayerFormId
}

export function PlayerTransport({
  isPlaying,
  isBuffering,
  onToggle,
  onPrev,
  onNext,
  size = 'sm',
  form = 'classic',
}: PlayerTransportProps) {
  const large = size === 'lg'
  const isLiquid = form === 'liquid-glass'
  const navClass = cn(
    'rounded-full',
    large && 'size-11',
    isLiquid &&
      'text-foreground/80 hover:bg-foreground/10 hover:text-foreground dark:text-white/85 dark:hover:bg-white/15 dark:hover:text-white',
  )

  return (
    <div className={cn('flex items-center', large ? 'gap-4' : 'gap-1.5')}>
      <Button
        type="button"
        variant="ghost"
        size={large ? 'icon' : 'icon-sm'}
        aria-label="上一首"
        onClick={onPrev}
        className={navClass}
      >
        <SkipBack className={cn('fill-current', large ? 'size-6' : 'size-4')} />
      </Button>

      <Button
        type="button"
        variant={isLiquid ? 'ghost' : 'default'}
        size="icon"
        disabled={isBuffering}
        aria-label={isPlaying ? '暂停' : '播放'}
        onClick={onToggle}
        className={cn(
          'rounded-full transition-transform hover:scale-105 active:scale-95',
          large ? 'size-14' : 'size-9',
          isLiquid
            ? cn(
                'ost-liquid-orb hover:bg-transparent dark:hover:bg-transparent',
                isPlaying && 'ost-liquid-orb-playing',
              )
            : large
              ? 'shadow-lg'
              : 'shadow-sm',
        )}
      >
        {isBuffering ? (
          <LoaderCircle className={cn('animate-spin', large ? 'size-6' : 'size-4')} />
        ) : isPlaying ? (
          <Pause className={cn('fill-current', large ? 'size-6' : 'size-4')} />
        ) : (
          <Play
            className={cn(
              'fill-current',
              large ? 'size-6 translate-x-[1.5px]' : 'size-4 translate-x-[1px]',
            )}
          />
        )}
      </Button>

      <Button
        type="button"
        variant="ghost"
        size={large ? 'icon' : 'icon-sm'}
        aria-label="下一首"
        onClick={onNext}
        className={navClass}
      >
        <SkipForward className={cn('fill-current', large ? 'size-6' : 'size-4')} />
      </Button>
    </div>
  )
}
