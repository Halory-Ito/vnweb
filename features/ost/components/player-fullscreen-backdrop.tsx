'use client'

import { cn } from '@/lib/utils'

import type { PlayerFormId } from '../lib/player-forms'

type PlayerFullscreenBackdropProps = {
  cover?: string
  immersive: boolean
  form: PlayerFormId
}

export function PlayerFullscreenBackdrop({
  cover,
  immersive,
  form,
}: PlayerFullscreenBackdropProps) {
  const isLiquid = form === 'liquid-glass'

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {cover ? (
        <img
          src={cover}
          alt=""
          className={cn(
            'size-full object-cover blur-3xl transition-opacity duration-700',
            isLiquid
              ? cn(
                  'scale-135 saturate-[2.1]',
                  immersive ? 'opacity-55 dark:opacity-45' : 'opacity-50 dark:opacity-40',
                )
              : cn(
                  'scale-125 saturate-150',
                  immersive ? 'opacity-45 dark:opacity-35' : 'opacity-35 dark:opacity-30',
                ),
          )}
        />
      ) : (
        <div
          className={cn(
            'size-full bg-gradient-to-br',
            isLiquid
              ? 'via-background from-sky-400/20 to-indigo-400/20'
              : 'from-primary/15 via-background to-muted/40',
          )}
        />
      )}

      {isLiquid ? (
        <>
          <div className="ost-liquid-aurora-a absolute -top-1/4 -left-1/6 size-[65vmax] rounded-full bg-sky-400/25 blur-3xl dark:bg-sky-400/20" />
          <div className="ost-liquid-aurora-b absolute -right-1/6 -bottom-1/4 size-[60vmax] rounded-full bg-indigo-400/20 blur-3xl dark:bg-violet-400/20" />
        </>
      ) : null}

      <div
        className={cn(
          'absolute inset-0 backdrop-blur-2xl transition-colors duration-700',
          isLiquid
            ? immersive
              ? 'bg-background/45 dark:bg-background/40'
              : 'bg-background/50 dark:bg-background/45'
            : immersive
              ? 'bg-background/60'
              : 'bg-background/70',
        )}
      />
    </div>
  )
}
