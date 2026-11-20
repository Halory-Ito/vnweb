'use client'

import { Volume1, Volume2, VolumeX } from 'lucide-react'

import { PlayerSlider } from './player-slider'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import type { PlayerFormId } from '../lib/player-forms'

type PlayerVolumeProps = {
  volume: number
  onChange: (volume: number) => void
  onToggleMute: () => void
  variant?: 'compact' | 'spread'
  form?: PlayerFormId
}

export function PlayerVolume({
  volume,
  onChange,
  onToggleMute,
  variant = 'compact',
  form = 'classic',
}: PlayerVolumeProps) {
  const isLiquid = form === 'liquid-glass'
  const buttonClass = cn(
    'rounded-full',
    isLiquid
      ? 'text-foreground/70 hover:bg-foreground/10 hover:text-foreground dark:text-white/75 dark:hover:bg-white/15 dark:hover:text-white'
      : 'text-muted-foreground hover:text-foreground',
  )

  if (variant === 'spread') {
    return (
      <div className="flex w-full items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={volume === 0 ? '取消静音' : '静音'}
          onClick={onToggleMute}
          className={buttonClass}
        >
          <VolumeX className="size-3.5" />
        </Button>
        <PlayerSlider
          form={form}
          aria-label="音量"
          max={1}
          step={0.01}
          value={[volume]}
          onValueChange={([value]) => onChange(value)}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="最大音量"
          onClick={() => onChange(1)}
          className={buttonClass}
        >
          <Volume2 className="size-3.5" />
        </Button>
      </div>
    )
  }

  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2

  return (
    <div className="hidden items-center gap-1 sm:flex">
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label={volume === 0 ? '取消静音' : '静音'}
        onClick={onToggleMute}
        className={buttonClass}
      >
        <VolumeIcon className="size-3.5" />
      </Button>
      <PlayerSlider
        form={form}
        aria-label="音量"
        className="w-16"
        max={1}
        step={0.01}
        value={[volume]}
        onValueChange={([value]) => onChange(value)}
      />
    </div>
  )
}
