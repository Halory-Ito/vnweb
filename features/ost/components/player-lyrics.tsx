'use client'

import { Music2 } from 'lucide-react'

import { usePlayerLyrics } from '../hooks/use-player-lyrics'
import { PlayerLyricLine } from './player-lyric-line'
import { PlayerLyricTrackToggles } from './player-lyric-track-toggles'
import { cn } from '@/lib/utils'

import type { OstSongItem } from '@/types'

type PlayerLyricsProps = {
  song: OstSongItem
  time: number
  duration: number
  onSeek: (time: number) => void
  variant?: 'compact' | 'immersive'
}

export function PlayerLyrics({
  song,
  time,
  duration,
  onSeek,
  variant = 'compact',
}: PlayerLyricsProps) {
  const lyrics = usePlayerLyrics(song, time)
  const immersive = variant === 'immersive'
  const showTrackBar = immersive && lyrics.cues.length > 0

  return (
    <div className={cn('flex flex-col', immersive && 'h-full')}>
      <div
        ref={lyrics.viewport}
        role="region"
        aria-label="实时歌词"
        tabIndex={0}
        className={cn(
          'relative overflow-x-hidden overflow-y-auto overscroll-contain focus-visible:outline-none',
          immersive
            ? 'h-full max-h-[58dvh] px-1 py-16 [mask-image:linear-gradient(to_bottom,transparent,black_14%,black_86%,transparent)] sm:px-3'
            : 'max-h-[min(32dvh,13rem)] px-3 py-6 text-center [mask-image:linear-gradient(to_bottom,transparent,black_16%,black_84%,transparent)]',
        )}
      >
        {lyrics.cues.length ? (
          <div className={cn(immersive ? 'space-y-3' : 'space-y-1.5')}>
            {lyrics.cues.map((cue, index) => (
              <PlayerLyricLine
                key={`${cue.time}-${index}`}
                ref={index === lyrics.active ? lyrics.current : null}
                cue={cue}
                isActive={index === lyrics.active}
                isPassed={lyrics.active >= 0 && index < lyrics.active}
                disabled={!duration || cue.time > duration}
                immersive={immersive}
                showOriginal={lyrics.tracks.original}
                showRomaji={lyrics.tracks.romaji}
                showTranslation={lyrics.tracks.translation}
                onSeek={onSeek}
              />
            ))}
          </div>
        ) : (
          <div
            className={cn(
              'text-muted-foreground flex flex-col items-center justify-center gap-2 text-center',
              immersive ? 'h-full min-h-48' : 'py-6',
            )}
          >
            <Music2 className={cn('opacity-40', immersive ? 'size-8' : 'size-5')} />
            <p
              className={cn(
                'wrap-anywhere whitespace-pre-wrap',
                immersive ? 'text-base' : 'text-xs',
              )}
            >
              {lyrics.loading
                ? '正在加载歌词…'
                : lyrics.error
                  ? '歌词文件加载失败'
                  : lyrics.text || '纯音乐，请欣赏'}
            </p>
          </div>
        )}
      </div>

      {showTrackBar ? (
        <PlayerLyricTrackToggles
          tracks={lyrics.tracks}
          hasTranslation={lyrics.hasTranslation}
          hasRomaji={lyrics.hasRomaji}
          onToggle={lyrics.toggleTrack}
          className="mt-2 justify-end px-2"
        />
      ) : null}
    </div>
  )
}
