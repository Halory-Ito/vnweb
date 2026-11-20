'use client'

import { ChevronDown, Sparkles, X } from 'lucide-react'

import { PlayerFormPicker } from './player-form-picker'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

import type { PlayerFormId } from '../lib/player-forms'

type MobileTab = 'stage' | 'lyrics' | 'queue'

type PlayerFullscreenHeaderProps = {
  songName: string
  albumName?: string
  form: PlayerFormId
  immersive: boolean
  isIdle: boolean
  mobileTab: MobileTab
  onFormChange: (form: PlayerFormId) => void
  onImmersiveChange: (value: boolean) => void
  onMobileTabChange: (tab: MobileTab) => void
  onHoverChange: (hovered: boolean) => void
  onExit: () => void
  onClose: () => void
}

export function PlayerFullscreenHeader({
  songName,
  albumName,
  form,
  immersive,
  isIdle,
  mobileTab,
  onFormChange,
  onImmersiveChange,
  onMobileTabChange,
  onHoverChange,
  onExit,
  onClose,
}: PlayerFullscreenHeaderProps) {
  const isLiquid = form === 'liquid-glass'

  return (
    <header
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
      className={cn(
        'relative z-20 flex items-center justify-between gap-3 px-4 pt-4 pb-2 transition-opacity duration-500 sm:px-8 sm:pt-6',
        isIdle && 'pointer-events-none opacity-0',
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="收起全屏播放器"
          onClick={onExit}
          className={cn('rounded-full', isLiquid && 'ost-liquid-pill hover:brightness-105')}
        >
          <ChevronDown className="size-5" />
        </Button>
        <div className="min-w-0">
          {immersive ? (
            <p className="truncate text-xs font-semibold sm:text-sm">{songName}</p>
          ) : null}
          {albumName ? <p className="text-muted-foreground truncate text-xs">{albumName}</p> : null}
        </div>
      </div>

      {!immersive ? (
        <div
          className={cn(
            'flex items-center rounded-full p-0.5 lg:hidden',
            isLiquid ? 'ost-liquid-pill' : 'bg-muted/60 border',
          )}
        >
          {(
            [
              ['stage', '播放'],
              ['lyrics', '歌词'],
              ['queue', '队列'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => onMobileTabChange(key)}
              className={cn(
                'cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-colors',
                mobileTab === key
                  ? isLiquid
                    ? 'bg-background/85 text-foreground shadow-xs dark:bg-white/20 dark:text-white'
                    : 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex shrink-0 items-center gap-2">
        <PlayerFormPicker
          form={form}
          onChange={onFormChange}
          variant="pill"
          side="bottom"
          align="end"
          onOpenChange={onHoverChange}
        />

        <label
          className={cn(
            'flex cursor-pointer items-center gap-2 rounded-full px-2.5 py-1 text-xs select-none',
            isLiquid ? 'ost-liquid-pill' : 'bg-background/60 border backdrop-blur-xs',
          )}
        >
          <Sparkles
            className={cn('size-3.5', immersive ? 'text-primary' : 'text-muted-foreground')}
          />
          <span className="hidden sm:inline">沉浸歌词</span>
          <Switch
            aria-label="开启沉浸式歌词体验"
            checked={immersive}
            onCheckedChange={onImmersiveChange}
            className="scale-90"
          />
        </label>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="关闭播放器"
          onClick={onClose}
          className={cn(
            'text-muted-foreground hover:text-foreground rounded-full',
            isLiquid &&
              'ost-liquid-pill text-foreground/80 hover:brightness-105 dark:text-white/85',
          )}
        >
          <X className="size-4.5" />
        </Button>
      </div>
    </header>
  )
}
