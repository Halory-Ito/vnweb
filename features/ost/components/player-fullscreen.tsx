'use client'

import { useAtom, useAtomValue } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { ListMusic, MicVocal } from 'lucide-react'
import { useState } from 'react'

import { useIdleVisibility } from '../hooks/use-idle-visibility'
import { immersiveThemeAtom, resolveImmersiveThemeId } from '../lib/immersive-themes'
import { PlayerFullscreenBackdrop } from './player-fullscreen-backdrop'
import { PlayerFullscreenHeader } from './player-fullscreen-header'
import { PlayerFullscreenStage } from './player-fullscreen-stage'
import { PlayerImmersiveLyrics } from './player-immersive-lyrics'
import { PlayerLyrics } from './player-lyrics'
import { PlayerQueue } from './player-queue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

import type { useGlobalSongPlayer } from '../hooks/use-song-player'
import type { PlayerFormId } from '../lib/player-forms'

type SidePanel = 'lyrics' | 'queue'
type MobileTab = 'stage' | 'lyrics' | 'queue'

const immersiveModeAtom = atomWithStorage('ost-player-immersive-lyrics', false)

type PlayerFullscreenProps = {
  open: boolean
  player: ReturnType<typeof useGlobalSongPlayer>
  form: PlayerFormId
  onFormChange: (form: PlayerFormId) => void
  onExit: () => void
}

export function PlayerFullscreen({
  open,
  player,
  form,
  onFormChange,
  onExit,
}: PlayerFullscreenProps) {
  const [immersive, setImmersive] = useAtom(immersiveModeAtom)
  const immersiveTheme = useAtomValue(immersiveThemeAtom)
  const [sidePanel, setSidePanel] = useState<SidePanel>('lyrics')
  const [mobileTab, setMobileTab] = useState<MobileTab>('stage')
  const idle = useIdleVisibility(open && immersive)
  const selection = player.selection
  if (!selection) return null

  const { song, album, items } = selection
  const hideAlbumBackdrop = immersive && resolveImmersiveThemeId(immersiveTheme) === 'backdrop'
  const isLiquid = form === 'liquid-glass'

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onExit()}>
      <DialogContent
        showCloseButton={false}
        data-player-form={form}
        onPointerMove={idle.notifyActivity}
        onKeyDown={idle.notifyActivity}
        className="ost-fullscreen-sheet bg-background inset-0 flex h-dvh w-full max-w-none translate-x-0 translate-y-0 flex-col overflow-hidden rounded-none border-0 p-0 sm:max-w-none"
      >
        <DialogTitle className="sr-only">全屏音乐播放器</DialogTitle>
        <DialogDescription className="sr-only">
          沉浸式音乐播放视图，支持封面展示、实时歌词同步、沉浸歌词剧场与待播队列切换
        </DialogDescription>

        {/* 专辑氛围背景层（映景模式由对应游戏详情背景接管，不透出专辑封面） */}
        {!hideAlbumBackdrop ? (
          <PlayerFullscreenBackdrop cover={album?.cover} immersive={immersive} form={form} />
        ) : null}

        <PlayerFullscreenHeader
          songName={song.name}
          albumName={album?.name}
          form={form}
          immersive={immersive}
          isIdle={idle.isIdle}
          mobileTab={mobileTab}
          onFormChange={onFormChange}
          onImmersiveChange={setImmersive}
          onMobileTabChange={setMobileTab}
          onHoverChange={idle.setPinned}
          onExit={onExit}
          onClose={player.close}
        />

        {immersive ? (
          <PlayerImmersiveLyrics
            form={form}
            player={player}
            song={song}
            album={album}
            isIdle={idle.isIdle}
            onControlsHover={idle.setPinned}
          />
        ) : (
          <main className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 items-center gap-8 overflow-y-auto px-5 py-4 sm:px-10 lg:grid-cols-12 lg:gap-14 lg:overflow-hidden lg:py-8">
            <PlayerFullscreenStage
              form={form}
              player={player}
              isQueueActive={sidePanel === 'queue'}
              onToggleQueue={() => setSidePanel((p) => (p === 'lyrics' ? 'queue' : 'lyrics'))}
              hiddenOnMobile={mobileTab !== 'stage'}
            />

            <section
              className={cn(
                'flex h-full w-full flex-col justify-center lg:col-span-7',
                mobileTab === 'stage' && 'hidden lg:flex',
              )}
            >
              <div className="mb-3 hidden items-center gap-1.5 lg:flex">
                <Button
                  type="button"
                  variant={!isLiquid && sidePanel === 'lyrics' ? 'outline' : 'ghost'}
                  size="sm"
                  onClick={() => setSidePanel('lyrics')}
                  className={cn(
                    'rounded-full',
                    isLiquid &&
                      (sidePanel === 'lyrics'
                        ? 'ost-liquid-pill text-foreground border-transparent dark:text-white'
                        : 'text-foreground/70 hover:bg-foreground/10 dark:text-white/75 dark:hover:bg-white/15'),
                  )}
                >
                  <MicVocal className="size-3.5" />
                  歌词
                </Button>
                <Button
                  type="button"
                  variant={!isLiquid && sidePanel === 'queue' ? 'outline' : 'ghost'}
                  size="sm"
                  onClick={() => setSidePanel('queue')}
                  className={cn(
                    'rounded-full',
                    isLiquid &&
                      (sidePanel === 'queue'
                        ? 'ost-liquid-pill text-foreground border-transparent dark:text-white'
                        : 'text-foreground/70 hover:bg-foreground/10 dark:text-white/75 dark:hover:bg-white/15'),
                  )}
                >
                  <ListMusic className="size-3.5" />
                  待播队列（{items.length}）
                </Button>
              </div>

              {mobileTab === 'lyrics' || (mobileTab === 'stage' && sidePanel === 'lyrics') ? (
                <PlayerLyrics
                  key={song.id}
                  song={song}
                  time={player.time}
                  duration={player.duration}
                  onSeek={player.seek}
                  variant="immersive"
                />
              ) : (
                <PlayerQueue
                  items={items}
                  currentSongId={song.id}
                  isPlaying={player.status.isPlaying}
                  onSelect={player.selectSong}
                  variant="immersive"
                />
              )}
            </section>
          </main>
        )}
      </DialogContent>
    </Dialog>
  )
}
