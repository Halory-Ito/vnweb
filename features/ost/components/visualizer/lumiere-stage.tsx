'use client'

import { AnimatePresence, motion } from 'motion/react'

import { CueTimePill } from './cue-time-pill'
import { getNeighborCueText, resolveCueTracks, type VisualizerStageProps } from './types'
import { cn } from '@/lib/utils'

export function LumiereStage({
  songId,
  cues,
  activeIndex,
  lineProgress,
  duration,
  tracks,
  onSeek,
}: VisualizerStageProps) {
  const safeIndex = activeIndex >= 0 ? activeIndex : 0
  const activeCue = cues[safeIndex]
  if (!activeCue) return null

  const prevCue = safeIndex > 0 ? cues[safeIndex - 1] : undefined
  const nextCue = cues[safeIndex + 1]
  const sweepPercent = Math.round(Math.max(0, Math.min(1, lineProgress)) * 100)
  const { hasRomaji, hasTranslation, renderOriginal } = resolveCueTracks(activeCue, tracks)

  return (
    <div className="flex w-full max-w-4xl flex-col items-center gap-7 text-center">
      {prevCue ? (
        <button
          type="button"
          disabled={!duration || prevCue.time > duration}
          onClick={() => onSeek(prevCue.time)}
          className="group/cue text-foreground/25 hover:text-foreground/75 inline-flex max-w-3xl cursor-pointer items-center justify-center gap-2 rounded-full px-4 py-1 text-sm font-medium transition-opacity sm:text-base"
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
            key={`lumiere-${songId}-${activeCue.time}-${safeIndex}`}
            initial={{ opacity: 0, filter: 'blur(10px)', scale: 0.97 }}
            animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
            exit={{ opacity: 0, filter: 'blur(10px)', scale: 1.02 }}
            transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
            className="w-full space-y-3.5 px-2"
          >
            {hasRomaji ? (
              <p className="text-foreground/65 text-sm font-medium tracking-wider sm:text-lg">
                {activeCue.romaji}
              </p>
            ) : null}

            {renderOriginal ? (
              <p
                style={{
                  backgroundImage: `linear-gradient(90deg, var(--foreground) 0%, #fef3c7 ${sweepPercent}%, color-mix(in oklch, var(--foreground) 22%, transparent) ${Math.min(100, sweepPercent + 14)}%, color-mix(in oklch, var(--foreground) 22%, transparent) 100%)`,
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
                className="text-3xl leading-snug font-bold tracking-tight text-balance drop-shadow-[0_0_24px_rgba(253,230,138,0.42)] sm:text-5xl"
              >
                {activeCue.original}
              </p>
            ) : null}

            <div className="bg-foreground/15 mx-auto h-px w-28 overflow-hidden rounded-full sm:w-44">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-200 via-amber-400 to-sky-300 transition-[width] duration-150"
                style={{ width: `${sweepPercent}%` }}
              />
            </div>

            {hasTranslation ? (
              <p
                className={cn(
                  'leading-relaxed text-balance',
                  renderOriginal
                    ? 'text-foreground/80 text-base font-medium sm:text-2xl'
                    : 'text-foreground text-3xl font-bold sm:text-5xl',
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
          className="group/cue text-foreground/40 hover:text-foreground/85 inline-flex max-w-3xl cursor-pointer items-center justify-center gap-2 rounded-full px-4 py-1 text-sm font-medium transition-opacity sm:text-base"
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
