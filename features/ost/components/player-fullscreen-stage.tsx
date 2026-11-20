'use client'

import { Disc3, ListMusic } from 'lucide-react'

import { PlayerModeButton } from './player-mode-button'
import { PlayerProgress } from './player-progress'
import { PlayerTransport } from './player-transport'
import { PlayerVolume } from './player-volume'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import type { useGlobalSongPlayer } from '../hooks/use-song-player'
import type { PlayerFormId } from '../lib/player-forms'

type PlayerFullscreenStageProps = {
  player: ReturnType<typeof useGlobalSongPlayer>
  isQueueActive: boolean
  onToggleQueue: () => void
  hiddenOnMobile?: boolean
  form?: PlayerFormId
}

export function PlayerFullscreenStage({
  player,
  isQueueActive,
  onToggleQueue,
  hiddenOnMobile = false,
  form = 'classic',
}: PlayerFullscreenStageProps) {
  const selection = player.selection
  if (!selection) return null

  const { song, album } = selection
  const isLiquid = form === 'liquid-glass'

  return (
    <section
      className={cn(
        'mx-auto flex w-full max-w-md flex-col items-center lg:col-span-5 lg:flex',
        hiddenOnMobile && 'hidden lg:flex',
      )}
    >
      <div
        className={cn(
          'bg-muted/60 aspect-square w-full max-w-[270px] overflow-hidden transition-transform duration-500 ease-out sm:max-w-[340px]',
          isLiquid
            ? 'ost-liquid-artwork rounded-[28px]'
            : 'border-foreground/10 rounded-2xl border shadow-[0_28px_70px_-18px_rgba(0,0,0,0.45)]',
          player.status.isPlaying ? 'scale-100' : 'scale-[0.94]',
        )}
      >
        {album?.cover ? (
          <img src={album.cover} alt={song.name} className="size-full object-cover" />
        ) : (
          <div className="text-muted-foreground flex size-full items-center justify-center">
            <Disc3 className="size-20 opacity-40" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="mt-7 w-full text-center lg:text-left">
        <h2 className="truncate text-xl font-bold tracking-tight sm:text-2xl" title={song.name}>
          {song.name}
        </h2>
        {album?.name ? (
          <p className="text-muted-foreground mt-1 truncate text-sm" title={album.name}>
            {album.name}
          </p>
        ) : null}
      </div>

      <div className="mt-5 w-full">
        <PlayerProgress
          form={form}
          layout="stacked"
          time={player.time}
          duration={player.duration}
          onSeek={player.seek}
        />
      </div>

      <div className="mt-5 flex w-full items-center justify-between">
        <PlayerModeButton form={form} mode={player.mode} onChange={player.setMode} size="md" />
        <PlayerTransport
          form={form}
          size="lg"
          isPlaying={player.status.isPlaying}
          isBuffering={player.status.isBuffering}
          onToggle={player.toggle}
          onPrev={() => player.move(-1)}
          onNext={() => player.move(1)}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={isQueueActive ? '切换至歌词' : '切换至待播队列'}
          onClick={onToggleQueue}
          className={cn(
            'rounded-full',
            isLiquid
              ? isQueueActive
                ? 'ost-liquid-pill text-foreground dark:text-white'
                : 'text-foreground/70 hover:bg-foreground/10 hover:text-foreground dark:text-white/75 dark:hover:bg-white/15 dark:hover:text-white'
              : isQueueActive
                ? 'text-primary hover:text-primary'
                : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <ListMusic className="size-4.5" />
        </Button>
      </div>

      <div className="mt-5 w-full">
        <PlayerVolume
          form={form}
          variant="spread"
          volume={player.volume}
          onChange={player.setVolume}
          onToggleMute={player.toggleMute}
        />
      </div>
    </section>
  )
}
