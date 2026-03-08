'use client'

import {
  ListOrdered,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type WheelEvent } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getGameOstsById, type GameMediaLinkItem } from '@/lib/game-utils'

type GameOSTProps = {
  gameId: number
  cover: string
  title: string
}

type PlayMode = 'shuffle' | 'sequence' | 'list-loop' | 'single-loop'
type ViewMode = 'lyric' | 'cover'

const MODE_LABELS: Record<PlayMode, string> = {
  shuffle: '随机播放',
  sequence: '顺序播放',
  'list-loop': '列表循环',
  'single-loop': '单曲循环',
}

const MODE_ORDER: PlayMode[] = [
  'shuffle',
  'sequence',
  'list-loop',
  'single-loop',
]

type LyricLine = {
  time: number
  text: string
}

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '00:00'
  }
  const safe = Math.floor(seconds)
  const minute = Math.floor(safe / 60)
  const second = safe % 60
  return `${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`
}

const toLyricUrl = (audioUrl: string) => {
  const clean = audioUrl.split('?')[0]
  const dotIndex = clean.lastIndexOf('.')
  if (dotIndex < 0) {
    return `${clean}.lrc`
  }
  return `${clean.slice(0, dotIndex)}.lrc`
}

const parseLrc = (raw: string): LyricLine[] => {
  const lines = raw.split(/\r?\n/)
  const parsed: LyricLine[] = []

  for (const line of lines) {
    const matches = [...line.matchAll(/\[(\d{1,2}):(\d{1,2}(?:\.\d{1,3})?)\]/g)]
    if (matches.length === 0) {
      continue
    }

    const text = line
      .replace(/\[(\d{1,2}):(\d{1,2}(?:\.\d{1,3})?)\]/g, '')
      .trim()
    for (const match of matches) {
      const minute = Number(match[1])
      const second = Number(match[2])
      if (!Number.isFinite(minute) || !Number.isFinite(second)) {
        continue
      }
      parsed.push({
        time: minute * 60 + second,
        text,
      })
    }
  }

  return parsed.sort((a, b) => a.time - b.time)
}

export default function GameOST({ gameId, cover, title }: GameOSTProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const pendingAutoPlayRef = useRef(false)
  const lastVolumeRef = useRef(80)
  const volumeContainerRef = useRef<HTMLDivElement | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [items, setItems] = useState<GameMediaLinkItem[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playMode, setPlayMode] = useState<PlayMode>('sequence')
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isSeeking, setIsSeeking] = useState(false)
  const [lyrics, setLyrics] = useState<LyricLine[]>([])
  const [lyricsLoading, setLyricsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('lyric')
  const [volume, setVolume] = useState(80)
  const [showVolumePanel, setShowVolumePanel] = useState(false)

  const selectedItem = useMemo(() => {
    if (items.length === 0) {
      return null
    }
    return items[Math.max(0, Math.min(selectedIndex, items.length - 1))] ?? null
  }, [items, selectedIndex])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = await getGameOstsById(gameId)
      setItems(data.items)
      setSelectedIndex((prev) =>
        data.items.length === 0 ? 0 : Math.min(prev, data.items.length - 1),
      )
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: string } }
        message?: string
      }
      toast.error(err.response?.data?.error || err.message || '加载OST失败')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [gameId])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    audio.loop = playMode === 'single-loop'
  }, [playMode])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    audio.volume = Math.max(0, Math.min(1, volume / 100))
  }, [volume, selectedItem])

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const container = volumeContainerRef.current
      if (!container) {
        return
      }

      if (!container.contains(event.target as Node)) {
        setShowVolumePanel(false)
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
    }
  }, [])

  useEffect(() => {
    const selected = selectedItem
    if (!selected) {
      setLyrics([])
      return
    }

    const loadLyric = async () => {
      const lyricUrl = toLyricUrl(selected.url)
      setLyricsLoading(true)
      try {
        const response = await fetch(lyricUrl)
        if (!response.ok) {
          setLyrics([])
          return
        }

        const content = await response.text()
        setLyrics(parseLrc(content))
      } catch {
        setLyrics([])
      } finally {
        setLyricsLoading(false)
      }
    }

    void loadLyric()
  }, [selectedItem])

  useEffect(() => {
    if (!selectedItem) {
      return
    }
    if (!pendingAutoPlayRef.current) {
      return
    }
    pendingAutoPlayRef.current = false
    void playCurrent()
  }, [selectedItem])

  const playCurrent = async () => {
    const audio = audioRef.current
    if (!audio || !selectedItem) {
      return
    }

    try {
      await audio.play()
      setIsPlaying(true)
    } catch {
      setIsPlaying(false)
    }
  }

  const pauseCurrent = () => {
    const audio = audioRef.current
    if (!audio) {
      return
    }
    audio.pause()
    setIsPlaying(false)
  }

  const getNextIndex = () => {
    if (items.length === 0) {
      return 0
    }

    if (playMode === 'shuffle') {
      if (items.length === 1) {
        return 0
      }
      let next = selectedIndex
      while (next === selectedIndex) {
        next = Math.floor(Math.random() * items.length)
      }
      return next
    }

    if (playMode === 'list-loop') {
      return (selectedIndex + 1) % items.length
    }

    return Math.min(selectedIndex + 1, items.length - 1)
  }

  const getPrevIndex = () => {
    if (items.length === 0) {
      return 0
    }

    if (playMode === 'shuffle') {
      if (items.length === 1) {
        return 0
      }
      let prev = selectedIndex
      while (prev === selectedIndex) {
        prev = Math.floor(Math.random() * items.length)
      }
      return prev
    }

    if (playMode === 'list-loop') {
      return (selectedIndex - 1 + items.length) % items.length
    }

    return Math.max(selectedIndex - 1, 0)
  }

  const handleNext = async () => {
    if (items.length === 0) {
      return
    }
    const nextIndex = getNextIndex()
    pendingAutoPlayRef.current = true
    setSelectedIndex(nextIndex)
  }

  const handlePrev = async () => {
    if (items.length === 0) {
      return
    }
    const prevIndex = getPrevIndex()
    pendingAutoPlayRef.current = true
    setSelectedIndex(prevIndex)
  }

  const handleEnded = () => {
    if (playMode === 'single-loop') {
      return
    }

    if (playMode === 'sequence' && selectedIndex >= items.length - 1) {
      setIsPlaying(false)
      return
    }

    void handleNext()
  }

  const toggleMode = () => {
    const currentIndex = MODE_ORDER.indexOf(playMode)
    const nextMode = MODE_ORDER[(currentIndex + 1) % MODE_ORDER.length]
    setPlayMode(nextMode)
  }

  const currentLyricIndex = useMemo(() => {
    if (lyrics.length === 0) {
      return -1
    }

    let index = -1
    for (let i = 0; i < lyrics.length; i += 1) {
      if (lyrics[i].time <= currentTime + 0.05) {
        index = i
      } else {
        break
      }
    }
    return index
  }, [lyrics, currentTime])

  const handleSeek = (value: number[]) => {
    const next = value[0] ?? 0
    setCurrentTime(next)
    setIsSeeking(true)
  }

  const commitSeek = (value: number[]) => {
    const next = value[0] ?? 0
    const audio = audioRef.current
    if (audio) {
      audio.currentTime = next
    }
    setCurrentTime(next)
    setIsSeeking(false)
  }

  const handleLyricClick = (time: number) => {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    audio.currentTime = time
    setCurrentTime(time)
    void playCurrent()
  }

  const handleVolumeChange = (value: number[]) => {
    const next = Math.max(0, Math.min(100, value[0] ?? 0))
    setVolume(next)
    if (next > 0) {
      lastVolumeRef.current = next
    }
  }

  const handleVolumeWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault()
    const delta = event.deltaY < 0 ? 4 : -4
    const next = Math.max(0, Math.min(100, volume + delta))
    setVolume(next)
    if (next > 0) {
      lastVolumeRef.current = next
    }
  }

  const toggleVolumePanel = () => {
    if (!selectedItem) {
      return
    }

    setShowVolumePanel((prev) => !prev)
  }

  const restoreFromMute = () => {
    const next = lastVolumeRef.current || 80
    setVolume(next)
  }

  const muteVolume = () => {
    if (volume > 0) {
      lastVolumeRef.current = volume
    }
    setVolume(0)
  }

  const handleViewModeChange = (value: string) => {
    if (value === 'lyric' || value === 'cover') {
      setViewMode(value)
    }
  }

  const renderVolumeControl = (buttonClassName?: string) => {
    return (
      <div ref={volumeContainerRef} className="relative">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={buttonClassName}
          disabled={!selectedItem}
          onClick={toggleVolumePanel}
          title="音量"
        >
          {volume > 0 ? (
            <Volume2 className="size-4" />
          ) : (
            <VolumeX className="size-4" />
          )}
        </Button>

        {showVolumePanel ? (
          <div
            onWheel={handleVolumeWheel}
            className="bg-background absolute right-0 bottom-12 z-20 flex w-16 flex-col items-center gap-2 rounded-md border p-2 shadow-md"
          >
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground text-xs"
              onClick={volume <= 0 ? restoreFromMute : muteVolume}
            >
              {volume <= 0 ? '恢复' : '静音'}
            </button>
            <Slider
              orientation="vertical"
              min={0}
              max={100}
              step={1}
              className="h-28 data-[orientation=vertical]:min-h-28"
              value={[volume]}
              onValueChange={handleVolumeChange}
              disabled={!selectedItem}
            />
            <div className="text-muted-foreground text-xs">{volume}%</div>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="space-y-3 rounded-md border p-3">
        <div className="flex items-center justify-between">
          {/* <div className="text-sm font-medium">OST 列表</div> */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={() => void loadData()}
          >
            刷新
          </Button>
        </div>

        <div className="max-h-105 space-y-2 overflow-y-auto">
          {isLoading ? (
            <div className="text-muted-foreground text-sm">加载中...</div>
          ) : items.length === 0 ? (
            <div className="text-muted-foreground text-sm">暂无OST</div>
          ) : (
            items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedIndex(index)}
                className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                  selectedIndex === index
                    ? 'bg-muted border-primary'
                    : 'hover:bg-muted/50'
                }`}
              >
                <div className="truncate font-medium">{item.name}</div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="space-y-4 rounded-md border p-4">
        <audio
          ref={audioRef}
          key={selectedItem?.id ?? 'empty'}
          src={selectedItem?.url}
          preload="metadata"
          onLoadedMetadata={(event) => {
            setDuration(event.currentTarget.duration || 0)
            setCurrentTime(0)
          }}
          onTimeUpdate={(event) => {
            if (isSeeking) {
              return
            }
            setCurrentTime(event.currentTarget.currentTime || 0)
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={handleEnded}
        />

        <Tabs
          value={viewMode}
          onValueChange={handleViewModeChange}
          className="space-y-4"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-medium">音乐播放器</div>
            <TabsList className="dark:bg-transparent">
              <TabsTrigger value="lyric" className="px-3 text-xs">
                歌词模式
              </TabsTrigger>
              <TabsTrigger value="cover" className="px-3 text-xs">
                封面模式
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="lyric" className="mt-0 space-y-3">
            <div className="text-lg font-semibold">
              {selectedItem?.name || '请选择一首 OST'}
            </div>
            <div className="text-muted-foreground text-sm">{title}</div>

            <div className="space-y-1">
              <Slider
                min={0}
                max={Math.max(duration, 1)}
                step={0.1}
                value={[Math.min(currentTime, Math.max(duration, 1))]}
                onValueChange={handleSeek}
                onValueCommit={commitSeek}
                disabled={!selectedItem}
              />
              <div className="text-muted-foreground flex justify-between text-xs">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={!selectedItem}
                onClick={() => void handlePrev()}
                title="上一首"
              >
                <SkipBack className="size-4" />
              </Button>

              {isPlaying ? (
                <Button
                  type="button"
                  size="icon"
                  disabled={!selectedItem}
                  onClick={pauseCurrent}
                  title="暂停"
                >
                  <Pause className="size-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  size="icon"
                  disabled={!selectedItem}
                  onClick={() => void playCurrent()}
                  title="播放"
                >
                  <Play className="size-4" />
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={!selectedItem}
                onClick={() => void handleNext()}
                title="下一首"
              >
                <SkipForward className="size-4" />
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={toggleMode}
                title="切换播放模式"
              >
                {playMode === 'shuffle' ? (
                  <Shuffle className="size-4" />
                ) : playMode === 'sequence' ? (
                  <ListOrdered className="size-4" />
                ) : playMode === 'single-loop' ? (
                  <Repeat1 className="size-4" />
                ) : (
                  <Repeat className="size-4" />
                )}
                {MODE_LABELS[playMode]}
              </Button>

              {renderVolumeControl()}
            </div>

            <div className="space-y-2 rounded-md border p-3">
              <div className="text-sm font-medium">歌词</div>
              <div className="max-h-60 space-y-1 overflow-y-auto">
                {lyricsLoading ? (
                  <div className="text-muted-foreground text-sm">
                    歌词加载中...
                  </div>
                ) : lyrics.length === 0 ? (
                  <div className="text-muted-foreground text-sm">
                    暂无歌词，可导入同名 .lrc 文件
                  </div>
                ) : (
                  lyrics.map((line, index) => (
                    <button
                      key={`${line.time}-${index}`}
                      type="button"
                      onClick={() => handleLyricClick(line.time)}
                      className={`block w-full rounded px-2 py-1 text-left text-sm ${
                        currentLyricIndex === index
                          ? 'bg-muted text-primary font-medium'
                          : 'text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      {line.text || '...'}
                    </button>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="cover" className="mt-0">
            <div className="relative overflow-hidden rounded-3xl border bg-linear-to-br from-zinc-100/80 via-white to-zinc-200/70 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.12)] dark:from-zinc-800/70 dark:via-zinc-900 dark:to-zinc-800/70">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.9),transparent_55%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_55%)]" />

              <div className="relative grid grid-cols-1 gap-6 md:grid-cols-[240px_minmax(0,1fr)] md:items-center">
                <div className="overflow-hidden rounded-2xl border border-white/40 bg-white/70 shadow-[0_14px_40px_rgba(0,0,0,0.18)] backdrop-blur dark:border-white/10 dark:bg-black/30">
                  {cover ? (
                    <img
                      src={cover}
                      alt={`${title} 封面`}
                      className="aspect-square w-full object-cover"
                    />
                  ) : (
                    <div className="text-muted-foreground flex aspect-square items-center justify-center text-sm">
                      无封面
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="truncate text-xl font-semibold">
                      {selectedItem?.name || '请选择一首 OST'}
                    </div>
                    <div className="text-muted-foreground text-sm">{title}</div>
                  </div>

                  <div className="space-y-1">
                    <Slider
                      min={0}
                      max={Math.max(duration, 1)}
                      step={0.1}
                      value={[Math.min(currentTime, Math.max(duration, 1))]}
                      onValueChange={handleSeek}
                      onValueCommit={commitSeek}
                      disabled={!selectedItem}
                    />
                    <div className="text-muted-foreground flex justify-between text-xs">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="bg-white/60 backdrop-blur dark:bg-black/20"
                      disabled={!selectedItem}
                      onClick={() => void handlePrev()}
                      title="上一首"
                    >
                      <SkipBack className="size-4" />
                    </Button>

                    {isPlaying ? (
                      <Button
                        type="button"
                        size="icon"
                        className="rounded-full"
                        disabled={!selectedItem}
                        onClick={pauseCurrent}
                        title="暂停"
                      >
                        <Pause className="size-4" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="icon"
                        className="rounded-full"
                        disabled={!selectedItem}
                        onClick={() => void playCurrent()}
                        title="播放"
                      >
                        <Play className="size-4" />
                      </Button>
                    )}

                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="bg-white/60 backdrop-blur dark:bg-black/20"
                      disabled={!selectedItem}
                      onClick={() => void handleNext()}
                      title="下一首"
                    >
                      <SkipForward className="size-4" />
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="bg-white/60 backdrop-blur dark:bg-black/20"
                      onClick={toggleMode}
                      title="切换播放模式"
                    >
                      {playMode === 'shuffle' ? (
                        <Shuffle className="size-4" />
                      ) : playMode === 'sequence' ? (
                        <ListOrdered className="size-4" />
                      ) : playMode === 'single-loop' ? (
                        <Repeat1 className="size-4" />
                      ) : (
                        <Repeat className="size-4" />
                      )}
                      {MODE_LABELS[playMode]}
                    </Button>

                    {renderVolumeControl(
                      'bg-white/60 backdrop-blur dark:bg-black/20',
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
