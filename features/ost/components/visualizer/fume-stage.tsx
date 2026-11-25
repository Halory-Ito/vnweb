'use client'

import { motion } from 'motion/react'

import { CueTimePill } from './cue-time-pill'
import { resolveCueTracks, type VisualizerStageProps } from './types'
import { cn } from '@/lib/utils'

const DEPTH_STYLE = [
  { opacity: 1, scale: 1, blur: 'blur(0px)' },
  { opacity: 0.48, scale: 0.9, blur: 'blur(1.5px)' },
  { opacity: 0.25, scale: 0.82, blur: 'blur(3.5px)' },
  { opacity: 0.12, scale: 0.76, blur: 'blur(6px)' },
] as const

const ALIGN_CLASSES = [
  'sm:self-start sm:text-left',
  'sm:self-center sm:text-center',
  'sm:self-end sm:text-right',
] as const

export function FumeStage({
  songId,
  cues,
  activeIndex,
  duration,
  tracks,
  onSeek,
}: VisualizerStageProps) {
  const safeIndex = activeIndex >= 0 ? activeIndex : 0
  const start = Math.max(0, safeIndex - 3)
  const end = Math.min(cues.length - 1, safeIndex + 3)
  const visible = cues.slice(start, end + 1)

  return (
    <div className="flex w-full max-w-5xl flex-col gap-3.5 px-2 sm:gap-4">
      {visible.map((cue, idx) => {
        const realIndex = start + idx
        const dist = Math.min(3, Math.abs(realIndex - safeIndex))
        const isCurrent = dist === 0
        const disabled = !duration || cue.time > duration
        const depth = DEPTH_STYLE[dist]
        const alignIndex = realIndex % 3
        const { hasRomaji, hasTranslation, renderOriginal } = resolveCueTracks(cue, tracks)
        const translationAsPrimary = !renderOriginal && hasTranslation
        const romajiAsPrimary = !renderOriginal && !hasTranslation && hasRomaji

        return (
          <motion.button
            key={`${songId}-${cue.time}-${realIndex}`}
            layout
            type="button"
            disabled={disabled}
            onClick={() => onSeek(cue.time)}
            animate={{ opacity: depth.opacity, scale: depth.scale }}
            style={{ filter: depth.blur }}
            transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'group/cue flex max-w-2xl cursor-pointer flex-col gap-1 rounded-2xl px-4 py-1.5 text-center transition-[filter,opacity] duration-200 hover:!opacity-95 hover:!blur-none disabled:cursor-default',
              ALIGN_CLASSES[alignIndex],
            )}
          >
            {hasRomaji && !romajiAsPrimary ? (
              <span className="text-foreground/60 text-xs font-medium sm:text-sm">
                {cue.romaji}
              </span>
            ) : null}

            <span
              className={cn(
                'inline-flex flex-wrap items-center justify-center gap-2 tracking-wide',
                alignIndex === 0
                  ? 'sm:justify-start'
                  : alignIndex === 2
                    ? 'sm:justify-end'
                    : 'sm:justify-center',
                isCurrent ? 'text-2xl font-bold sm:text-4xl' : 'text-lg font-medium sm:text-2xl',
              )}
            >
              {renderOriginal ? (
                <span>{cue.original}</span>
              ) : translationAsPrimary ? (
                <span>{cue.translation}</span>
              ) : romajiAsPrimary ? (
                <span>{cue.romaji}</span>
              ) : null}
              {!disabled ? <CueTimePill time={cue.time} /> : null}
            </span>

            {hasTranslation && !translationAsPrimary ? (
              <span className="text-foreground/75 text-sm font-medium sm:text-lg">
                {cue.translation}
              </span>
            ) : null}
          </motion.button>
        )
      })}
    </div>
  )
}
