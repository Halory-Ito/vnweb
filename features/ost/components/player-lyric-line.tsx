'use client'

import { Play } from 'lucide-react'
import { forwardRef, memo } from 'react'

import { cn } from '@/lib/utils'

import { formatPlayerTime } from '../lib/play-mode'

import type { LrcCue } from '../lib/parse-lrc'

type PlayerLyricLineProps = {
  cue: LrcCue
  isActive: boolean
  isPassed: boolean
  disabled: boolean
  immersive: boolean
  showOriginal: boolean
  showRomaji: boolean
  showTranslation: boolean
  onSeek: (time: number) => void
}

const PlayerLyricLineInner = forwardRef<HTMLButtonElement, PlayerLyricLineProps>(
  function PlayerLyricLine(
    {
      cue,
      isActive,
      isPassed,
      disabled,
      immersive,
      showOriginal,
      showRomaji,
      showTranslation,
      onSeek,
    },
    ref,
  ) {
    const hasRomajiLine = showRomaji && Boolean(cue.romaji)
    const hasTranslationLine = showTranslation && Boolean(cue.translation)
    const showFallbackOriginal = !showOriginal && !hasRomajiLine && !hasTranslationLine
    const renderOriginal = showOriginal || showFallbackOriginal

    return (
      <button
        ref={ref}
        type="button"
        aria-current={isActive ? 'true' : undefined}
        disabled={disabled}
        onClick={() => onSeek(cue.time)}
        className={cn(
          'group/line relative flex w-full cursor-pointer items-center gap-3 rounded-xl transition-[opacity,color,transform,background-color] duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-default',
          immersive
            ? cn(
                'origin-left justify-between px-3 py-2 text-left hover:bg-foreground/5',
                isActive
                  ? 'text-foreground scale-[1.02] opacity-100'
                  : isPassed
                    ? 'text-foreground/35 hover:text-foreground/80 opacity-85'
                    : 'text-foreground/50 hover:text-foreground/85 opacity-90',
              )
            : cn(
                'justify-center px-2.5 py-1 text-center',
                isActive
                  ? 'text-foreground scale-[1.03] font-semibold'
                  : 'text-muted-foreground/60 hover:text-foreground/85',
              ),
        )}
      >
        <div className={cn('min-w-0 flex-1 space-y-1', !immersive && 'text-center')}>
          {hasRomajiLine ? (
            <p
              className={cn(
                'wrap-anywhere leading-snug',
                immersive
                  ? renderOriginal
                    ? 'text-xs font-medium opacity-75 sm:text-sm'
                    : isActive
                      ? 'text-xl font-bold sm:text-2xl'
                      : 'text-base font-semibold sm:text-lg'
                  : 'text-[11px] opacity-75',
              )}
            >
              {cue.romaji}
            </p>
          ) : null}

          {renderOriginal ? (
            <p
              className={cn(
                'wrap-anywhere leading-snug',
                immersive
                  ? isActive
                    ? 'text-2xl font-bold sm:text-3xl'
                    : 'text-lg font-semibold sm:text-xl'
                  : isActive
                    ? 'text-sm font-semibold'
                    : 'text-xs',
              )}
            >
              {cue.original}
            </p>
          ) : null}

          {hasTranslationLine ? (
            <p
              className={cn(
                'wrap-anywhere leading-snug',
                immersive
                  ? renderOriginal
                    ? 'text-sm font-medium opacity-80 sm:text-base'
                    : isActive
                      ? 'text-2xl font-bold sm:text-3xl'
                      : 'text-lg font-semibold sm:text-xl'
                  : 'text-[11px] opacity-80',
              )}
            >
              {cue.translation}
            </p>
          ) : null}
        </div>

        {!disabled ? (
          <span
            aria-hidden="true"
            className={cn(
              'bg-background/85 text-muted-foreground pointer-events-none shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium tabular-nums opacity-0 shadow-xs backdrop-blur-xs transition-opacity duration-150 group-hover/line:opacity-100 group-focus-visible/line:opacity-100',
              immersive ? 'inline-flex' : 'hidden sm:inline-flex',
            )}
          >
            <Play className="size-2.5 fill-current" />
            {formatPlayerTime(cue.time)}
          </span>
        ) : null}
      </button>
    )
  },
)

export const PlayerLyricLine = memo(PlayerLyricLineInner)
