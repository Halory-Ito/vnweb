'use client'

import { Loader2Icon, MusicIcon, PauseIcon, PlayIcon, Volume2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import type { OstSongItem } from '@/types'

type GameMemoryOstBarProps = {
  songs: OstSongItem[]
  activeSongId: number | null
  isPlaying: boolean
  isBuffering: boolean
  isMemoryPlaying: boolean
  onTogglePlayAll: () => void
  onSelectTrack: (song: OstSongItem) => void
}

export function GameMemoryOstBar({
  songs,
  activeSongId,
  isPlaying,
  isBuffering,
  isMemoryPlaying,
  onTogglePlayAll,
  onSelectTrack,
}: GameMemoryOstBarProps) {
  if (songs.length === 0) {
    return null
  }

  return (
    <div className="border-border/60 flex flex-wrap items-center gap-2 border-t pt-3">
      <Button type="button" variant="outline" size="xs" onClick={onTogglePlayAll}>
        {isMemoryPlaying ? (
          <>
            <PauseIcon className="size-3.5" />
            暂停配乐
          </>
        ) : (
          <>
            <PlayIcon className="size-3.5" />
            播放配乐
          </>
        )}
      </Button>

      {songs.map((song) => {
        const isCurrent = activeSongId === song.id
        const showSpinner = isCurrent && isBuffering
        const showActive = isCurrent && isPlaying

        return (
          <Button
            key={song.id}
            type="button"
            variant="outline"
            size="xs"
            onClick={() => onSelectTrack(song)}
            className={cn('max-w-52 font-normal', isCurrent && 'border-primary/60 text-primary')}
            title={song.name}
          >
            {showSpinner ? (
              <Loader2Icon className="size-3.5 shrink-0 animate-spin" />
            ) : showActive ? (
              <Volume2Icon className="size-3.5 shrink-0" />
            ) : (
              <MusicIcon className="size-3.5 shrink-0" />
            )}
            <span className="truncate">{song.name}</span>
          </Button>
        )
      })}
    </div>
  )
}
