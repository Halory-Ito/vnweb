'use client'

import { useAtom } from 'jotai'
import { useState } from 'react'

import { usePlayerDrag } from '../hooks/use-player-drag'
import { useGlobalSongPlayer } from '../hooks/use-song-player'
import { playerFormAtom, resolvePlayerFormId } from '../lib/player-forms'
import { PlayerFloatingCard } from './player-floating-card'
import { type DrawerTab } from './player-floating-drawer'
import { PlayerFullscreen } from './player-fullscreen'
import { PlayerLiquidCard } from './player-liquid-card'
import { PlayerLiquidMini } from './player-liquid-mini'
import { PlayerMiniBar } from './player-mini-bar'

type PlayerView = 'mini' | 'simple' | 'full'

export function GlobalSongPlayer() {
  const player = useGlobalSongPlayer()
  const [rawForm, setForm] = useAtom(playerFormAtom)
  const form = resolvePlayerFormId(rawForm)
  const [view, setView] = useState<PlayerView>('simple')
  const [lastFloatingView, setLastFloatingView] = useState<'mini' | 'simple'>('simple')
  const [drawer, setDrawer] = useState<DrawerTab>('none')
  const drag = usePlayerDrag(Boolean(player.selection) && view !== 'full', `${view}:${form}`)

  const openFullscreen = () => {
    if (view !== 'full') setLastFloatingView(view)
    setView('full')
  }

  const toggleDrawer = (tab: Exclude<DrawerTab, 'none'>) =>
    setDrawer((prev) => (prev === tab ? 'none' : tab))

  return (
    <>
      <audio {...player.mediaProps} />
      {player.selection ? (
        <>
          <PlayerFullscreen
            open={view === 'full'}
            player={player}
            form={form}
            onFormChange={setForm}
            onExit={() => setView(lastFloatingView)}
          />
          {view === 'mini' ? (
            form === 'liquid-glass' ? (
              <PlayerLiquidMini
                player={player}
                drag={drag}
                onExpand={() => setView('simple')}
                onFullscreen={openFullscreen}
              />
            ) : (
              <PlayerMiniBar
                player={player}
                drag={drag}
                onExpand={() => setView('simple')}
                onFullscreen={openFullscreen}
              />
            )
          ) : view === 'simple' ? (
            form === 'liquid-glass' ? (
              <PlayerLiquidCard
                player={player}
                drag={drag}
                form={form}
                onFormChange={setForm}
                drawer={drawer}
                onToggleDrawer={toggleDrawer}
                onMini={() => setView('mini')}
                onFullscreen={openFullscreen}
              />
            ) : (
              <PlayerFloatingCard
                player={player}
                drag={drag}
                form={form}
                onFormChange={setForm}
                drawer={drawer}
                onToggleDrawer={toggleDrawer}
                onMini={() => setView('mini')}
                onFullscreen={openFullscreen}
              />
            )
          ) : null}
        </>
      ) : null}
    </>
  )
}
