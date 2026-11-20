'use client'

import { useAtom } from 'jotai'
import { Disc3 } from 'lucide-react'

import { useGameBackdrop } from '../hooks/use-game-backdrop'
import { usePlayerLyrics } from '../hooks/use-player-lyrics'
import { immersiveThemeAtom, resolveImmersiveThemeId } from '../lib/immersive-themes'
import { ImmersiveBackdropMask } from './immersive-backdrop-mask'
import { ImmersiveThemePicker } from './immersive-theme-picker'
import { LiquidGlassSurface } from './liquid-glass-surface'
import { PlayerLyricTrackToggles } from './player-lyric-track-toggles'
import { PlayerModeButton } from './player-mode-button'
import { PlayerProgress } from './player-progress'
import { PlayerTransport } from './player-transport'
import { FumeStage } from './visualizer/fume-stage'
import { HanabiBackdropStage } from './visualizer/hanabi-backdrop-stage'
import { LumiereStage } from './visualizer/lumiere-stage'
import { MonetStage } from './visualizer/monet-stage'
import { PartitaStage } from './visualizer/partita-stage'
import { VisualizerCanvas } from './visualizer/visualizer-canvas'
import { cn } from '@/lib/utils'

import type { PlayerAlbum, useGlobalSongPlayer } from '../hooks/use-song-player'
import type { PlayerFormId } from '../lib/player-forms'
import type { VisualizerStageProps } from './visualizer/types'
import type { OstSongItem } from '@/types'

type PlayerImmersiveLyricsProps = {
  player: ReturnType<typeof useGlobalSongPlayer>
  song: OstSongItem
  album?: PlayerAlbum
  isIdle: boolean
  onControlsHover: (hovered: boolean) => void
  form?: PlayerFormId
}

export function PlayerImmersiveLyrics({
  player,
  song,
  album,
  isIdle,
  onControlsHover,
  form = 'classic',
}: PlayerImmersiveLyricsProps) {
  const [theme, setTheme] = useAtom(immersiveThemeAtom)
  const resolvedTheme = resolveImmersiveThemeId(theme)
  const lyrics = usePlayerLyrics(song, player.time)
  const gameBackdropUrl = useGameBackdrop(song.gameId, album?.gameBg)
  const activeIndex = lyrics.active
  const activeCue = activeIndex >= 0 ? lyrics.cues[activeIndex] : lyrics.cues[0]
  const nextCue = activeIndex >= 0 ? lyrics.cues[activeIndex + 1] : lyrics.cues[1]
  const isLiquid = form === 'liquid-glass'

  const lineStart = activeCue?.time ?? 0
  const lineEnd = nextCue?.time ?? (player.duration > lineStart ? player.duration : lineStart + 4)
  const lineProgress =
    activeIndex >= 0 && lineEnd > lineStart ? (player.time - lineStart) / (lineEnd - lineStart) : 0

  const stageProps: VisualizerStageProps = {
    songId: song.id,
    songName: song.name,
    album,
    cues: lyrics.cues,
    activeIndex,
    lineProgress,
    duration: player.duration,
    isPlaying: player.status.isPlaying,
    tracks: lyrics.tracks,
    onSeek: player.seek,
  }

  const controlsBody = (
    <>
      <PlayerProgress
        form={form}
        time={player.time}
        duration={player.duration}
        onSeek={player.seek}
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <ImmersiveThemePicker
            theme={resolvedTheme}
            onChange={setTheme}
            onOpenChange={onControlsHover}
          />
          <PlayerModeButton form={form} mode={player.mode} onChange={player.setMode} />
        </div>
        <PlayerTransport
          form={form}
          isPlaying={player.status.isPlaying}
          isBuffering={player.status.isBuffering}
          onToggle={player.toggle}
          onPrev={() => player.move(-1)}
          onNext={() => player.move(1)}
        />
        {lyrics.cues.length > 0 ? (
          <PlayerLyricTrackToggles
            tracks={lyrics.tracks}
            hasTranslation={lyrics.hasTranslation}
            hasRomaji={lyrics.hasRomaji}
            onToggle={lyrics.toggleTrack}
          />
        ) : (
          <div className="w-8" aria-hidden="true" />
        )}
      </div>
    </>
  )

  return (
    <div className="relative z-10 flex flex-1 flex-col items-center justify-between px-6 pt-2 pb-6 sm:px-12 sm:pb-8">
      {resolvedTheme === 'backdrop' ? (
        <ImmersiveBackdropMask imageUrl={gameBackdropUrl} isPlaying={player.status.isPlaying} />
      ) : (
        <VisualizerCanvas
          theme={resolvedTheme}
          isPlaying={player.status.isPlaying}
          activeIndex={activeIndex}
        />
      )}

      <div className="relative z-10 my-auto flex w-full flex-col items-center justify-center">
        {lyrics.cues.length > 0 ? (
          resolvedTheme === 'monet' ? (
            <MonetStage {...stageProps} />
          ) : resolvedTheme === 'lumiere' ? (
            <LumiereStage {...stageProps} />
          ) : resolvedTheme === 'fume' ? (
            <FumeStage {...stageProps} />
          ) : resolvedTheme === 'partita' ? (
            <PartitaStage {...stageProps} />
          ) : (
            <HanabiBackdropStage mode={resolvedTheme} {...stageProps} />
          )
        ) : (
          <div className="flex flex-col items-center gap-5 text-center">
            <div
              className={cn(
                'bg-muted/50 size-36 overflow-hidden sm:size-44',
                isLiquid
                  ? 'ost-liquid-artwork rounded-[28px]'
                  : 'border-foreground/10 rounded-2xl border shadow-2xl',
              )}
            >
              {album?.cover ? (
                <img src={album.cover} alt={song.name} className="size-full object-cover" />
              ) : (
                <div className="text-muted-foreground flex size-full items-center justify-center">
                  <Disc3 className="size-12 opacity-40" aria-hidden="true" />
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <h2 className="text-2xl font-bold tracking-tight sm:text-4xl">{song.name}</h2>
              <p className="text-muted-foreground text-sm sm:text-base">
                {lyrics.loading ? '正在加载歌词…' : lyrics.text || '纯音乐，请欣赏'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 底部极简悬浮播控卡 */}
      <div
        onMouseEnter={() => onControlsHover(true)}
        onMouseLeave={() => onControlsHover(false)}
        className={cn(
          'relative z-20 w-full max-w-xl transition-all duration-500',
          !isLiquid && 'bg-background/70 rounded-2xl border px-4 py-3 shadow-xl backdrop-blur-2xl',
          isIdle ? 'pointer-events-none translate-y-3 opacity-0' : 'translate-y-0 opacity-100',
        )}
      >
        {isLiquid ? (
          <LiquidGlassSurface
            cover={album?.cover}
            isPlaying={player.status.isPlaying}
            className="rounded-[26px] px-4 py-3"
          >
            {controlsBody}
          </LiquidGlassSurface>
        ) : (
          controlsBody
        )}
      </div>
    </div>
  )
}
