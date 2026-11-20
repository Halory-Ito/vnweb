'use client'

import { Disc3, ListMusic, Maximize2, MicVocal, Minimize2, X } from 'lucide-react'

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

type PlayerFloatingCardProps = {
  player: ReturnType<typeof useGlobalSongPlayer>
  drag: ReturnType<typeof usePlayerDrag>
  form: PlayerFormId
  onFormChange: (form: PlayerFormId) => void
  drawer: DrawerTab
  onToggleDrawer: (tab: Exclude<DrawerTab, 'none'>) => void
  onMini: () => void
  onFullscreen: () => void
}

export function PlayerFloatingCard({
  player,
  drag,
  form,
  onFormChange,
  drawer,
  onToggleDrawer,
  onMini,
  onFullscreen,
}: PlayerFloatingCardProps) {
  const selection = player.selection
  if (!selection) return null

  const { song, album } = selection

  return (
    <div
      ref={drag.panel}
      style={drag.style}
      role="region"
      aria-label="全局音乐播放器"
      title="长按可拖动位置"
      data-player-form="classic"
      {...drag.handle}
      className={cn(
        'bg-background/85 fixed right-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 w-[min(calc(100vw-1.5rem),26rem)] overflow-hidden rounded-2xl border shadow-[0_20px_50px_-14px_rgba(0,0,0,0.3)] backdrop-blur-2xl transition-[box-shadow,transform] duration-150 sm:right-5 sm:bottom-5',
        drag.isDragging && 'ring-primary/35 scale-[1.02] cursor-grabbing select-none ring-2',
      )}
    >
      <PlayerFloatingDrawer form="classic" drawer={drawer} player={player} />

      <div className="space-y-2.5 px-3.5 pt-3 pb-3">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onFullscreen}
            aria-label="展开全屏播放器"
            className="group/cover bg-muted relative flex size-11 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border shadow-xs"
          >
            {album?.cover ? (
              <img src={album.cover} alt="" className="size-full object-cover" />
            ) : (
              <Disc3 className="text-muted-foreground size-5" aria-hidden="true" />
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition-opacity group-hover/cover:opacity-100">
              <Maximize2 className="size-3.5" />
            </span>
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm leading-tight font-semibold" title={song.name}>
              {song.name}
            </p>
            {album?.name ? (
              <p className="text-muted-foreground mt-0.5 truncate text-xs" title={album.name}>
                {album.name}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-0.5">
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
                className="text-muted-foreground hover:text-foreground rounded-full"
              >
                <Icon className="size-3.5" />
              </Button>
            ))}
          </div>
        </div>

        <PlayerProgress time={player.time} duration={player.duration} onSeek={player.seek} />

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-0.5">
            <PlayerModeButton mode={player.mode} onChange={player.setMode} />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="实时歌词"
              aria-pressed={drawer === 'lyrics'}
              title="歌词"
              onClick={() => onToggleDrawer('lyrics')}
              className={cn(
                'rounded-full',
                drawer === 'lyrics'
                  ? 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <MicVocal className="size-4" />
            </Button>
          </div>

          <PlayerTransport
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
              className={cn(
                'rounded-full',
                drawer === 'queue'
                  ? 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <ListMusic className="size-4" />
            </Button>
            <PlayerVolume
              volume={player.volume}
              onChange={player.setVolume}
              onToggleMute={player.toggleMute}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
