'use client'

import { motion } from 'motion/react'

import { CueTimePill } from './cue-time-pill'
import { resolveCueTracks, type VisualizerStageProps } from './types'
import { cn } from '@/lib/utils'

const STEP_INDENTS = ['sm:pl-0', 'sm:pl-8', 'sm:pl-16', 'sm:pl-24', 'sm:pl-32'] as const

export function PartitaStage({
  songId,
  cues,
  activeIndex,
  duration,
  tracks,
  onSeek,
}: VisualizerStageProps) {
  const safeIndex = activeIndex >= 0 ? activeIndex : 0
  const start = Math.max(0, safeIndex - 2)
  const end = Math.min(cues.length - 1, safeIndex + 2)
  const visible = cues.slice(start, end + 1)

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-2 sm:gap-5">
      {visible.map((cue, idx) => {
        const realIndex = start + idx
        const dist = Math.abs(realIndex - safeIndex)
        const isCurrent = dist === 0
        const disabled = !duration || cue.time > duration
        const indentClass = STEP_INDENTS[Math.min(STEP_INDENTS.length - 1, idx)]
        const { hasRomaji, hasTranslation, renderOriginal } = resolveCueTracks(cue, tracks)
        const translationAsPrimary = !renderOriginal && hasTranslation
        const romajiAsPrimary = !renderOriginal && !hasTranslation && hasRomaji

        return (
          <motion.div
            key={`${songId}-${cue.time}-${realIndex}`}
            layout
            animate={{
              opacity: isCurrent ? 1 : dist === 1 ? 0.5 : 0.24,
            }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={cn('w-full', indentClass)}
          >
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSeek(cue.time)}
              className={cn(
                'group/cue flex w-full cursor-pointer items-start gap-3 border-l-2 py-1.5 pl-4 text-left transition-colors hover:opacity-95 disabled:cursor-default',
                isCurrent ? 'border-primary' : 'border-border/50',
              )}
            >
              <span
                className={cn(
                  'mt-1 shrink-0 text-xs font-medium tabular-nums',
                  isCurrent ? 'text-primary' : 'text-muted-foreground/70',
                )}
              >
                {String(realIndex + 1).padStart(2, '0')} —
              </span>

              <div className="min-w-0 flex-1 space-y-1">
                {hasRomaji && !romajiAsPrimary ? (
                  <p className="text-foreground/60 text-xs font-medium sm:text-sm">{cue.romaji}</p>
                ) : null}

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      'leading-snug tracking-tight wrap-anywhere',
                      isCurrent
                        ? 'text-foreground text-2xl font-bold sm:text-4xl'
                        : 'text-foreground/85 text-base font-medium sm:text-xl',
                    )}
                  >
                    {renderOriginal
                      ? cue.original
                      : translationAsPrimary
                        ? cue.translation
                        : romajiAsPrimary
                          ? cue.romaji
                          : cue.original}
                  </span>
                  {!disabled ? <CueTimePill time={cue.time} /> : null}
                </div>

                {hasTranslation && !translationAsPrimary ? (
                  <p
                    className={cn(
                      'wrap-anywhere',
                      isCurrent
                        ? 'text-foreground/80 text-sm font-medium sm:text-lg'
                        : 'text-muted-foreground text-xs sm:text-sm',
                    )}
                  >
                    {cue.translation}
                  </p>
                ) : null}
              </div>
            </button>
          </motion.div>
        )
      })}
    </div>
  )
}
