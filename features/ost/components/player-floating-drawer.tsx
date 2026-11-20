'use client'

import { PlayerLyrics } from './player-lyrics'
import { PlayerQueue } from './player-queue'

import type { useGlobalSongPlayer } from '../hooks/use-song-player'
import type { PlayerFormId } from '../lib/player-forms'

export type DrawerTab = 'none' | 'lyrics' | 'queue'

type PlayerFloatingDrawerProps = {
  drawer: DrawerTab
  player: ReturnType<typeof useGlobalSongPlayer>
  form?: PlayerFormId
}

export function PlayerFloatingDrawer({
  drawer,
  player,
  form = 'classic',
}: PlayerFloatingDrawerProps) {
  const selection = player.selection
  if (drawer === 'none' || !selection) return null

  const { song, items } = selection

  const content =
    drawer === 'lyrics' ? (
      <PlayerLyrics
        key={song.id}
        song={song}
        time={player.time}
        duration={player.duration}
        onSeek={player.seek}
        variant="compact"
      />
    ) : (
      <PlayerQueue
        items={items}
        currentSongId={song.id}
        isPlaying={player.status.isPlaying}
        onSelect={player.selectSong}
        variant="compact"
      />
    )

  if (form === 'liquid-glass') {
    return (
      <div data-no-drag="true">
        {content}
        <div
          aria-hidden="true"
          className="via-foreground/15 h-px bg-gradient-to-r from-transparent to-transparent dark:via-white/25"
        />
      </div>
    )
  }

  return (
    <div data-no-drag="true" className="border-border/50 bg-muted/20 border-b">
      {content}
    </div>
  )
}
