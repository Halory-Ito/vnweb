'use client'

import { AnimatePresence, motion } from 'motion/react'

import { CueTimePill } from './cue-time-pill'
import { getNeighborCueText, resolveCueTracks, type VisualizerStageProps } from './types'
import { cn } from '@/lib/utils'

type HanabiBackdropStageProps = VisualizerStageProps & {
  mode: 'hanabi' | 'backdrop'
}

export function HanabiBackdropStage({
  mode,
  songId,
  cues,
  activeIndex,
  duration,
  tracks,
  onSeek,
}: HanabiBackdropStageProps) {
  const safeIndex = activeIndex >= 0 ? activeIndex : 0
  const activeCue = cues[safeIndex]
  if (!activeCue) return null

  const prevCue = safeIndex > 0 ? cues[safeIndex - 1] : undefined
  const nextCue = cues[safeIndex + 1]
  const isHanabi = mode === 'hanabi'
  const { hasRomaji, hasTranslation, renderOriginal } = resolveCueTracks(activeCue, tracks)

  const motionProps = isHanabi
    ? {
        initial: { opacity: 0, scale: 0.92, filter: 'blur(6px)' },
        animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
        exit: { opacity: 0, scale: 1.05, filter: 'blur(6px)' },
        transition: { duration: 0.46, ease: [0.22, 1, 0.36, 1] as const },
      }
    : {
        initial: { opacity: 0, y: 18, filter: 'blur(5px)' },
        animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
        exit: { opacity: 0, y: -14, filter: 'blur(5px)' },
        transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] as const },
      }

  return (
    <div className="flex w-full max-w-4xl flex-col items-center gap-6 text-center">
      {prevCue ? (
        <button
          type="button"
          disabled={!duration || prevCue.time > duration}
          onClick={() => onSeek(prevCue.time)}
          className="group/cue text-foreground/30 hover:text-foreground/80 inline-flex max-w-3xl cursor-pointer items-center justify-center gap-2 rounded-full px-4 py-1 text-sm font-medium transition-opacity sm:text-base"
        >
          <span className="truncate">{getNeighborCueText(prevCue, tracks)}</span>
          {duration && prevCue.time <= duration ? <CueTimePill time={prevCue.time} /> : null}
        </button>
      ) : (
        <div className="h-8" aria-hidden="true" />
      )}

      <div className="flex min-h-36 w-full items-center justify-center sm:min-h-48">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${mode}-${songId}-${activeCue.time}-${safeIndex}`}
            {...motionProps}
            className="w-full space-y-3 px-2"
          >
            {hasRomaji ? (
              <p
                className={cn(
                  'text-sm font-medium tracking-wide sm:text-lg',
                  isHanabi
                    ? 'text-foreground/70'
                    : 'text-foreground/85 drop-shadow-[0_1px_10px_rgba(0,0,0,0.45)]',
                )}
              >
                {activeCue.romaji}
              </p>
            ) : null}

            {renderOriginal ? (
              <p
                className={cn(
                  'text-foreground text-3xl leading-snug font-bold tracking-tight text-balance sm:text-5xl',
                  isHanabi
                    ? 'drop-shadow-[0_0_26px_rgba(251,191,36,0.35)]'
                    : 'drop-shadow-[0_2px_18px_rgba(0,0,0,0.45)]',
                )}
              >
                {activeCue.original}
              </p>
            ) : null}

            {hasTranslation ? (
              <p
                className={cn(
                  'leading-relaxed text-balance',
                  renderOriginal
                    ? 'text-foreground/80 text-base font-medium sm:text-2xl'
                    : 'text-foreground text-3xl font-bold sm:text-5xl',
                  !isHanabi && 'drop-shadow-[0_2px_14px_rgba(0,0,0,0.45)]',
                )}
              >
                {activeCue.translation}
              </p>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      {nextCue ? (
        <button
          type="button"
          disabled={!duration || nextCue.time > duration}
          onClick={() => onSeek(nextCue.time)}
          className="group/cue text-foreground/45 hover:text-foreground/85 inline-flex max-w-3xl cursor-pointer items-center justify-center gap-2 rounded-full px-4 py-1 text-sm font-medium transition-opacity sm:text-base"
        >
          <span className="truncate">{getNeighborCueText(nextCue, tracks)}</span>
          {duration && nextCue.time <= duration ? <CueTimePill time={nextCue.time} /> : null}
        </button>
      ) : (
        <div className="h-8" aria-hidden="true" />
      )}
    </div>
  )
}
