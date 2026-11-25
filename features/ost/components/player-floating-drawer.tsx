'use client'

import { AnimatePresence, motion, useIsPresent, useReducedMotion } from 'motion/react'

import { PlayerLyrics } from './player-lyrics'
import { PlayerQueue } from './player-queue'

import type { useGlobalSongPlayer } from '../hooks/use-song-player'
import type { PlayerFormId } from '../lib/player-forms'
import type { ReactNode } from 'react'

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

  return (
    <AnimatePresence initial={false}>
      {drawer !== 'none' && selection && (
        <FloatingDrawerPanel key="drawer">
          <FloatingDrawerContent drawer={drawer} player={player} form={form} />
        </FloatingDrawerPanel>
      )}
    </AnimatePresence>
  )
}

function FloatingDrawerPanel({ children }: { children: ReactNode }) {
  const isPresent = useIsPresent()
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      data-no-drag="true"
      inert={!isPresent}
      className="overflow-hidden"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.32, 0.72, 0, 1] }}
    >
      {children}
    </motion.div>
  )
}

function FloatingDrawerContent({ drawer, player, form }: PlayerFloatingDrawerProps) {
  if (!player.selection) return null

  const { song, items } = player.selection

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
