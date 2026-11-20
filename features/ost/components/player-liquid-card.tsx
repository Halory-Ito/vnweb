'use client'

import { Disc3, ListMusic, Maximize2, MicVocal, Minimize2, X } from 'lucide-react'

import { LiquidGlassSurface } from './liquid-glass-surface'
import { PlayerFloatingDrawer, type DrawerTab } from './player-floating-drawer'
import { PlayerFormPicker } from './player-form-picker'
import { PlayerModeButton } from './player-mode-button'
import { PlayerProgress } from './player-progress'
import { PlayerTransport } from './player-transport'
import { PlayerVolume } from './player-volume'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import type { usePlayerDrag } from '../hooks/use-player-drag'
import type { useGlobalSongPlayer } from '../hooks/use-song-player'
import type { PlayerFormId } from '../lib/player-forms'

type PlayerLiquidCardProps = {
  player: ReturnType<typeof useGlobalSongPlayer>
  drag: ReturnType<typeof usePlayerDrag>
  form: PlayerFormId
  onFormChange: (form: PlayerFormId) => void
  drawer: DrawerTab
  onToggleDrawer: (tab: Exclude<DrawerTab, 'none'>) => void
  onMini: () => void
  onFullscreen: () => void
}

export function PlayerLiquidCard({
  player,
  drag,
  form,
  onFormChange,
  drawer,
  onToggleDrawer,
  onMini,
  onFullscreen,
}: PlayerLiquidCardProps) {
  const selection = player.selection
  if (!selection) return null

  const { song, album } = selection
  const iconButtonClass =
    'rounded-full text-foreground/75 hover:bg-foreground/10 hover:text-foreground dark:text-white/80 dark:hover:bg-white/15 dark:hover:text-white'
  const activeDrawerClass =
    'rounded-full bg-foreground/12 text-foreground hover:bg-foreground/15 dark:bg-white/18 dark:text-white dark:hover:bg-white/25'

  return (
    <div
      ref={drag.panel}
      style={drag.style}
      role="region"
      aria-label="全局音乐播放器"
      title="长按可拖动位置"
      data-player-form="liquid-glass"
      {...drag.handle}
      className={cn(
        'fixed right-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 w-[min(calc(100vw-1.5rem),26.5rem)] rounded-[28px] transition-transform duration-200 sm:right-5 sm:bottom-5',
        drag.isDragging &&
          'scale-[1.025] cursor-grabbing select-none ring-2 ring-white/60 dark:ring-white/35',
      )}
    >
      <LiquidGlassSurface
        cover={album?.cover}
        isPlaying={player.status.isPlaying}
        className="rounded-[28px]"
      >
        <PlayerFloatingDrawer form="liquid-glass" drawer={drawer} player={player} />

        <div className="space-y-3 px-4 py-3.5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onFullscreen}
              aria-label="展开全屏播放器"
              className="group/cover bg-muted/60 relative flex size-12 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl shadow-sm ring-1 ring-white/60 dark:ring-white/25"
            >
              {album?.cover ? (
                <img src={album.cover} alt="" className="size-full object-cover" />
              ) : (
                <Disc3 className="text-muted-foreground size-5" aria-hidden="true" />
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-black/35 text-white opacity-0 transition-opacity group-hover/cover:opacity-100">
                <Maximize2 className="size-3.5" />
              </span>
            </button>

            <div className="min-w-0 flex-1">
              <p
                className="text-foreground truncate text-sm leading-tight font-semibold"
                title={song.name}
              >
                {song.name}
              </p>
              {album?.name ? (
                <p
                  className="text-foreground/65 mt-0.5 truncate text-xs dark:text-white/70"
                  title={album.name}
                >
                  {album.name}
                </p>
              ) : null}
            </div>

            <div className="ost-liquid-pill flex shrink-0 items-center gap-0.5 rounded-full px-1 py-0.5">
              <PlayerFormPicker
                form={form}
                onChange={onFormChange}
                variant="icon"
                side="top"
                align="end"
              />
              {(
                [
                  ['切换为迷你胶囊', '迷你模式', onMini, Minimize2],
                  ['全屏沉浸模式', '全屏播放', onFullscreen, Maximize2],
                  ['关闭播放器', '关闭', player.close, X],
                ] as const
              ).map(([label, title, onClick, Icon]) => (
                <Button
                  key={label}
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={label}
                  title={title}
                  onClick={onClick}
                  className={iconButtonClass}
                >
                  <Icon className="size-3.5" />
                </Button>
              ))}
            </div>
          </div>

          <PlayerProgress
            form="liquid-glass"
            time={player.time}
            duration={player.duration}
            onSeek={player.seek}
          />

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-0.5">
              <PlayerModeButton form="liquid-glass" mode={player.mode} onChange={player.setMode} />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="实时歌词"
                aria-pressed={drawer === 'lyrics'}
                title="歌词"
                onClick={() => onToggleDrawer('lyrics')}
                className={drawer === 'lyrics' ? activeDrawerClass : iconButtonClass}
              >
                <MicVocal className="size-4" />
              </Button>
            </div>

            <PlayerTransport
              form="liquid-glass"
              isPlaying={player.status.isPlaying}
              isBuffering={player.status.isBuffering}
              onToggle={player.toggle}
              onPrev={() => player.move(-1)}
              onNext={() => player.move(1)}
            />

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="待播队列"
                aria-pressed={drawer === 'queue'}
                title="待播队列"
                onClick={() => onToggleDrawer('queue')}
                className={drawer === 'queue' ? activeDrawerClass : iconButtonClass}
              >
                <ListMusic className="size-4" />
              </Button>
              <PlayerVolume
                form="liquid-glass"
                volume={player.volume}
                onChange={player.setVolume}
                onToggleMute={player.toggleMute}
              />
            </div>
          </div>
        </div>
      </LiquidGlassSurface>
    </div>
  )
}
