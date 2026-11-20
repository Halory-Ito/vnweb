'use client'

import { ListOrdered, Repeat, Repeat1, Shuffle } from 'lucide-react'

import { PLAY_MODE_LABELS, nextPlayMode, type PlayMode } from '../lib/play-mode'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import type { PlayerFormId } from '../lib/player-forms'

type PlayerModeButtonProps = {
  mode: PlayMode
  onChange: (mode: PlayMode) => void
  size?: 'sm' | 'md'
  form?: PlayerFormId
}

export function PlayerModeButton({
  mode,
  onChange,
  size = 'sm',
  form = 'classic',
}: PlayerModeButtonProps) {
  const isActive = mode !== 'sequence'
  const isLiquid = form === 'liquid-glass'
  const label = PLAY_MODE_LABELS[mode]
  const iconClass = size === 'md' ? 'size-4.5' : 'size-4'

  return (
    <Button
      type="button"
      variant="ghost"
      size={size === 'md' ? 'icon' : 'icon-sm'}
      aria-label={`播放模式：${label}`}
      title={`${label}（点击切换）`}
      onClick={() => onChange(nextPlayMode(mode))}
      className={cn(
        'relative rounded-full transition-colors',
        isLiquid
          ? isActive
            ? 'bg-foreground/10 text-foreground hover:bg-foreground/15 dark:bg-white/15 dark:text-white dark:hover:bg-white/20'
            : 'text-foreground/65 hover:bg-foreground/10 hover:text-foreground dark:text-white/70 dark:hover:bg-white/15 dark:hover:text-white'
          : isActive
            ? 'text-primary hover:text-primary'
            : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {mode === 'shuffle' ? (
        <Shuffle className={iconClass} />
      ) : mode === 'single-loop' ? (
        <Repeat1 className={iconClass} />
      ) : mode === 'list-loop' ? (
        <Repeat className={iconClass} />
      ) : (
        <ListOrdered className={iconClass} />
      )}
      {isActive ? (
        <span
          aria-hidden="true"
          className={cn(
            'absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full',
            isLiquid
              ? 'bg-sky-500 shadow-[0_0_6px_rgba(56,189,248,0.75)] dark:bg-sky-300'
              : 'bg-primary',
          )}
        />
      ) : null}
    </Button>
  )
}
