'use client'

import {
  FileTextIcon,
  Loader2Icon,
  PauseIcon,
  PlayIcon,
  SkipBackIcon,
  SkipForwardIcon,
  Volume2Icon,
  VolumeXIcon,
  XIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'

import type { OstSongItem } from '@/types'

type SongMiniPlayerProps = {
  song: OstSongItem | null
  isPlaying: boolean
  isBuffering: boolean
  currentTime: number
  duration: number
  volume: number
  onTogglePlay: () => void
  onPrev: () => void
  onNext: () => void
  onSeek: (value: number) => void
  onVolumeChange: (value: number) => void
  onPreviewLyric: (song: OstSongItem) => void
  onClose: () => void
}

const formatTime = (sec: number) => {
  if (!Number.isFinite(sec) || sec <= 0) return '00:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function SongMiniPlayer({
  song,
  isPlaying,
  isBuffering,
  currentTime,
  duration,
  volume,
  onTogglePlay,
  onPrev,
  onNext,
  onSeek,
  onVolumeChange,
  onPreviewLyric,
  onClose,
}: SongMiniPlayerProps) {
  if (!song) {
    return null
  }

  return (
    <div className="bg-background/95 sticky bottom-3 z-30 rounded-2xl border-2 px-4 py-3 shadow-lg backdrop-blur-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        {/* 曲名与控制按钮 */}
        <div className="flex min-w-0 items-center justify-between gap-3 sm:w-64">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{song.name}</p>
            <p className="text-muted-foreground text-[11px] tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="rounded-full"
              onClick={onPrev}
              aria-label="上一首"
            >
              <SkipBackIcon className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="rounded-full"
              onClick={onTogglePlay}
              aria-label={isPlaying ? '暂停' : '播放'}
            >
              {isBuffering ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : isPlaying ? (
                <PauseIcon className="size-4" />
              ) : (
                <PlayIcon className="size-4" />
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="rounded-full"
              onClick={onNext}
              aria-label="下一首"
            >
              <SkipForwardIcon className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* 播放进度条 */}
        <div className="flex flex-1 items-center gap-2">
          <Slider
            value={[currentTime]}
            max={duration > 0 ? duration : 100}
            step={1}
            disabled={duration <= 0}
            onValueChange={(vals) => onSeek(vals[0] ?? 0)}
            aria-label="播放进度"
          />
        </div>

        {/* 音量、歌词与关闭 */}
        <div className="flex items-center justify-end gap-2">
          <div className="hidden w-28 items-center gap-1.5 md:flex">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="rounded-full"
              onClick={() => onVolumeChange(volume > 0 ? 0 : 0.8)}
              aria-label={volume > 0 ? '静音' : '恢复音量'}
            >
              {volume > 0 ? <Volume2Icon className="size-3.5" /> : <VolumeXIcon className="size-3.5" />}
            </Button>
            <Slider
              value={[Math.round(volume * 100)]}
              max={100}
              step={1}
              onValueChange={(vals) => onVolumeChange((vals[0] ?? 80) / 100)}
              aria-label="音量"
            />
          </div>

          {song.lyricsText || song.lyricsPath ? (
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              className="rounded-full"
              onClick={() => onPreviewLyric(song)}
              aria-label="查看歌词"
            >
              <FileTextIcon className="size-3.5" />
            </Button>
          ) : null}

          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="rounded-full"
            onClick={onClose}
            aria-label="关闭播放器"
          >
            <XIcon className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
