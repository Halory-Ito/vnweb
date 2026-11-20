'use client'

import { Disc3 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'

import { cn } from '@/lib/utils'

import { CueTimePill } from './cue-time-pill'
import { getNeighborCueText, resolveCueTracks, type VisualizerStageProps } from './types'

export function MonetStage({
  songId,
  songName,
  album,
  cues,
  activeIndex,
  lineProgress,
  duration,
  isPlaying,
  tracks,
  onSeek,
}: VisualizerStageProps) {
  const safeIndex = activeIndex >= 0 ? activeIndex : 0
  const activeCue = cues[safeIndex]
  if (!activeCue) return null

  const prevCue = safeIndex > 0 ? cues[safeIndex - 1] : undefined
  const nextCues = cues.slice(safeIndex + 1, safeIndex + 3)
  const sweepPercent = Math.round(Math.max(0, Math.min(1, lineProgress)) * 100)
  const { hasRomaji, hasTranslation, renderOriginal } = resolveCueTracks(activeCue, tracks)

  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
      {/* 左栏：画廊海报歌词轨 */}
      <div className="space-y-6 text-center lg:col-span-7 lg:text-left">
        <div className="text-muted-foreground flex items-center justify-center gap-3 text-xs tracking-widest uppercase tabular-nums lg:justify-start">
          <span>
            {String(safeIndex + 1).padStart(2, '0')} / {String(cues.length).padStart(2, '0')}
          </span>
          <span className="bg-border h-px w-10" aria-hidden="true" />
        </div>

        {prevCue ? (
          <button
            type="button"
            disabled={!duration || prevCue.time > duration}
            onClick={() => onSeek(prevCue.time)}
            className="group/cue text-foreground/30 hover:text-foreground/70 inline-flex max-w-full cursor-pointer items-center gap-2 text-base font-medium transition-colors sm:text-lg"
          >
            <span className="truncate">{getNeighborCueText(prevCue, tracks)}</span>
            {duration && prevCue.time <= duration ? <CueTimePill time={prevCue.time} /> : null}
          </button>
        ) : (
          <div className="h-7" aria-hidden="true" />
        )}

        <div className="min-h-28 sm:min-h-36">
          <AnimatePresence mode="wait">
            <motion.div
              key={`monet-${songId}-${activeCue.time}-${safeIndex}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-2.5"
            >
              {hasRomaji ? (
                <p className="text-foreground/65 text-sm font-medium tracking-wide sm:text-base">
                  {activeCue.romaji}
                </p>
              ) : null}

              {renderOriginal ? (
                <p
                  style={{
                    backgroundImage: `linear-gradient(90deg, var(--foreground) 0%, var(--foreground) ${sweepPercent}%, color-mix(in oklch, var(--foreground) 30%, transparent) ${Math.min(100, sweepPercent + 10)}%, color-mix(in oklch, var(--foreground) 30%, transparent) 100%)`,
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent',
                  }}
                  className="text-3xl leading-snug font-bold tracking-tight text-balance sm:text-5xl"
                >
                  {activeCue.original}
                </p>
              ) : null}

              {hasTranslation ? (
                <p
                  className={cn(
                    'leading-relaxed text-balance',
                    renderOriginal
                      ? 'text-foreground/75 text-base font-medium sm:text-xl'
                      : 'text-foreground text-3xl font-bold sm:text-5xl',
                  )}
                >
                  {activeCue.translation}
                </p>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex flex-col items-center gap-2.5 lg:items-start">
          {nextCues.map((cue, i) => {
            const disabled = !duration || cue.time > duration
            return (
              <button
                key={`${cue.time}-${i}`}
                type="button"
                disabled={disabled}
                onClick={() => onSeek(cue.time)}
                className={cn(
                  'group/cue inline-flex max-w-full cursor-pointer items-center gap-2 font-medium transition-colors hover:text-foreground/85',
                  i === 0 ? 'text-foreground/45 text-base sm:text-lg' : 'text-foreground/25 text-sm sm:text-base',
                )}
              >
                <span className="truncate">{getNeighborCueText(cue, tracks)}</span>
                {!disabled ? <CueTimePill time={cue.time} /> : null}
              </button>
            )
          })}
        </div>
      </div>

      {/* 右栏：印象派画框海报 */}
      <div className="hidden justify-end lg:col-span-5 lg:flex">
        <div
          className={cn(
            'bg-background/60 w-full max-w-[330px] rounded-2xl border p-3.5 shadow-[0_28px_70px_-18px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-transform duration-700 ease-out',
            isPlaying ? 'scale-100' : 'scale-[0.96]',
          )}
        >
          <div className="bg-muted aspect-square w-full overflow-hidden rounded-xl border">
            {album?.cover ? (
              <img src={album.cover} alt={songName} className="size-full object-cover" />
            ) : (
              <div className="text-muted-foreground flex size-full items-center justify-center">
                <Disc3 className="size-16 opacity-35" aria-hidden="true" />
              </div>
            )}
          </div>
          <div className="mt-3 space-y-0.5 px-1 text-right">
            <p className="truncate text-sm font-semibold">{songName}</p>
            {album?.name ? (
              <p className="text-muted-foreground truncate text-xs">{album.name}</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
