'use client'

import {
  ChevronLeft,
  ListOrdered,
  Palette,
  Pause,
  Play,
  Repeat,
  Repeat1,
  RotateCcw,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Layers,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'
import { api } from '@/lib/request-utils'

// --- 工具函数：Hex 转 RGBA ---
const hexToRgba = (hex: string, opacity: number) => {
  if (!hex) return 'rgba(255, 255, 255, 1)'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`
}

// --- 类型定义 ---
type GameOSTProps = {
  gameId: number
  cover: string
  title: string
}

type PlayMode = 'shuffle' | 'sequence' | 'list-loop' | 'single-loop'
type ViewMode = 'album' | 'song'

type OstAlbumItem = {
  id: number
  gameId: number
  name: string
  cover: string
  resource: string
}

type OstSongItem = {
  id: number
  gameId: number
  ostId: number
  name: string
  url: string
  mediaType: string
}

const MODE_LABELS: Record<PlayMode, string> = {
  shuffle: '随机',
  sequence: '顺序',
  'list-loop': '循环',
  'single-loop': '单曲',
}

const MODE_ORDER: PlayMode[] = [
  'shuffle',
  'sequence',
  'list-loop',
  'single-loop',
]

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00'
  const safe = Math.floor(seconds)
  const minute = Math.floor(safe / 60)
  const second = safe % 60
  return `${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`
}

export default function GameOST({ gameId, cover, title }: GameOSTProps) {
  const { resolvedTheme } = useTheme()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const pendingAutoPlayRef = useRef(false)
  const colorInputRef = useRef<HTMLInputElement>(null)

  // --- 状态管理 ---
  const [isLoading, setIsLoading] = useState(false)
  const [ostItems, setOstItems] = useState<OstAlbumItem[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('album')
  const [selectedAlbum, setSelectedAlbum] = useState<OstAlbumItem | null>(null)
  const [songs, setSongs] = useState<OstSongItem[]>([])
  const [selectedSongIndex, setSelectedSongIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playMode, setPlayMode] = useState<PlayMode>('sequence')
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isSeeking, setIsSeeking] = useState(false)
  const [volume, setVolume] = useState(80)

  const [playerColor, setPlayerColor] = useState('')
  const [opacity, setOpacity] = useState(100)
  const [hasCustomStyle, setHasCustomStyle] = useState(false)

  // --- 样式初始化与持久化 ---
  useEffect(() => {
    const savedColor = localStorage.getItem(`ost-color-${gameId}`)
    const savedOpacity = localStorage.getItem(`ost-opacity-${gameId}`)

    if (savedColor) {
      setPlayerColor(savedColor)
      setOpacity(savedOpacity ? parseInt(savedOpacity) : 100)
      setHasCustomStyle(true)
    } else {
      setPlayerColor(resolvedTheme === 'dark' ? '#18181b' : '#ffffff')
      setOpacity(100)
      setHasCustomStyle(false)
    }
  }, [resolvedTheme, gameId])

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value
    setPlayerColor(newColor)
    setHasCustomStyle(true)
    localStorage.setItem(`ost-color-${gameId}`, newColor)
  }

  const handleOpacityChange = (val: number[]) => {
    const newOpacity = val[0]
    setOpacity(newOpacity)
    setHasCustomStyle(true)
    localStorage.setItem(`ost-opacity-${gameId}`, newOpacity.toString())
  }

  const resetStyle = () => {
    localStorage.removeItem(`ost-color-${gameId}`)
    localStorage.removeItem(`ost-opacity-${gameId}`)
    setHasCustomStyle(false)
    setPlayerColor(resolvedTheme === 'dark' ? '#18181b' : '#ffffff')
    setOpacity(100)
  }

  // --- API 数据加载 ---
  const loadData = async () => {
    setIsLoading(true)
    try {
      const response = await api.get('/ost', { params: { gameId } })
      const data = response.data as { data: { items: OstAlbumItem[] } }
      setOstItems(data.data.items)
    } catch {
      toast.error('加载 OST 失败')
    } finally {
      setIsLoading(false)
    }
  }

  const loadSongs = async (ostId: number) => {
    try {
      const response = await api.get('/ost/songs', { params: { ostId } })
      const data = response.data as { data: { items: OstSongItem[] } }
      setSongs(data.data.items)
    } catch {
      setSongs([])
    }
  }

  useEffect(() => {
    void loadData()
  }, [gameId])
  useEffect(() => {
    if (selectedAlbum) void loadSongs(selectedAlbum.id)
  }, [selectedAlbum])

  const selectedSong = useMemo(() => {
    if (songs.length === 0) return null
    return (
      songs[Math.max(0, Math.min(selectedSongIndex, songs.length - 1))] ?? null
    )
  }, [songs, selectedSongIndex])

  const handleNext = () => {
    if (songs.length === 0) return
    let next = selectedSongIndex
    if (playMode === 'shuffle' && songs.length > 1) {
      while (next === selectedSongIndex)
        next = Math.floor(Math.random() * songs.length)
    } else if (playMode === 'list-loop') {
      next = (selectedSongIndex + 1) % songs.length
    } else {
      next = Math.min(selectedSongIndex + 1, songs.length - 1)
    }
    pendingAutoPlayRef.current = true
    setSelectedSongIndex(next)
  }

  useEffect(() => {
    if (selectedSong && pendingAutoPlayRef.current) {
      pendingAutoPlayRef.current = false
      const audio = audioRef.current
      if (audio) {
        audio.src = selectedSong.url
        audio
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false))
      }
    }
  }, [selectedSong])

  // --- UI 组件渲染 ---
  const renderCoverPlayer = () => (
    <div
      className="relative overflow-hidden rounded-2xl border p-5 shadow-xl transition-all duration-500"
      style={{
        borderColor:
          resolvedTheme === 'dark'
            ? 'rgba(255,255,255,0.1)'
            : 'rgba(0,0,0,0.08)',
      }}
    >
      <div
        className="absolute inset-0 -z-10 transition-colors duration-500"
        style={{
          backgroundColor: hexToRgba(playerColor || '#ffffff', opacity),
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-50"
        style={{
          background:
            resolvedTheme === 'dark'
              ? 'radial-gradient(circle at top right, rgba(255,255,255,0.1), transparent)'
              : 'radial-gradient(circle at top right, rgba(255,255,255,0.7), transparent)',
        }}
      />

      <div className="relative grid grid-cols-1 gap-5 md:grid-cols-[160px_minmax(0,1fr)] md:items-center">
        <div className="overflow-hidden rounded-xl border border-white/20 shadow-md backdrop-blur-sm">
          {selectedAlbum?.cover ? (
            <img
              src={selectedAlbum.cover}
              alt=""
              className="aspect-square w-full object-cover"
            />
          ) : (
            <div className="bg-muted flex aspect-square items-center justify-center text-xs">
              无封面
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="space-y-0.5">
            <h3 className="truncate text-lg leading-tight font-bold">
              {selectedSong?.name || '未选择歌曲'}
            </h3>
            <p className="text-muted-foreground text-xs opacity-80">
              {selectedAlbum?.name}
            </p>
          </div>

          <Slider
            min={0}
            max={Math.max(duration, 1)}
            step={0.1}
            value={[Math.min(currentTime, duration)]}
            onValueChange={(v) => {
              setCurrentTime(v[0])
              setIsSeeking(true)
            }}
            onValueCommit={(v) => {
              if (audioRef.current) audioRef.current.currentTime = v[0]
              setIsSeeking(false)
            }}
            disabled={!selectedSong}
            className="py-1"
          />

          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => {
                let prev = selectedSongIndex
                if (playMode === 'shuffle')
                  prev = Math.floor(Math.random() * songs.length)
                else
                  prev = (selectedSongIndex - 1 + songs.length) % songs.length
                setSelectedSongIndex(prev)
                pendingAutoPlayRef.current = true
              }}
              disabled={!selectedSong}
            >
              <SkipBack className="size-3.5" />
            </Button>

            <Button
              size="icon"
              className="size-8 rounded-full"
              onClick={() => {
                if (isPlaying) {
                  audioRef.current?.pause()
                  setIsPlaying(false)
                } else {
                  audioRef.current?.play()
                  setIsPlaying(true)
                }
              }}
              disabled={!selectedSong}
            >
              {isPlaying ? (
                <Pause className="size-3.5" />
              ) : (
                <Play className="size-3.5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={handleNext}
              disabled={!selectedSong}
            >
              <SkipForward className="size-3.5" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-[10px]"
              onClick={() => {
                const currentIndex = MODE_ORDER.indexOf(playMode)
                setPlayMode(MODE_ORDER[(currentIndex + 1) % MODE_ORDER.length])
              }}
            >
              <span className="max-w-10 truncate">{MODE_LABELS[playMode]}</span>
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  {volume > 0 ? (
                    <Volume2 className="size-3.5" />
                  ) : (
                    <VolumeX className="size-3.5" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-12 p-3" side="top">
                <Slider
                  orientation="vertical"
                  min={0}
                  max={100}
                  value={[volume]}
                  onValueChange={(v) => {
                    setVolume(v[0])
                    if (audioRef.current) audioRef.current.volume = v[0] / 100
                  }}
                  className="h-24"
                />
              </PopoverContent>
            </Popover>

            <div className="ml-auto flex items-center gap-1">
              {hasCustomStyle && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground size-8"
                  onClick={resetStyle}
                >
                  <RotateCcw className="size-3.5" />
                </Button>
              )}

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8">
                    <Palette
                      className="size-3.5"
                      style={{
                        color: hasCustomStyle ? playerColor : 'inherit',
                      }}
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-48 space-y-4 p-4"
                  side="top"
                  align="end"
                >
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-medium">
                      <Palette className="size-3" /> 背景颜色
                    </label>
                    <div
                      className="flex h-8 w-full cursor-pointer items-center justify-center rounded-md border text-[10px]"
                      style={{ backgroundColor: playerColor }}
                      onClick={() => colorInputRef.current?.click()}
                    >
                      点击修改
                    </div>
                    <input
                      ref={colorInputRef}
                      type="color"
                      className="hidden"
                      value={playerColor}
                      onChange={handleColorChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center justify-between text-xs font-medium">
                      <span className="flex items-center gap-2">
                        <Layers className="size-3" /> 透明度
                      </span>
                      <span className="text-[10px] opacity-60">{opacity}%</span>
                    </label>
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={[opacity]}
                      onValueChange={handleOpacityChange}
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <audio
        ref={audioRef}
        key={selectedSong?.url ?? 'empty'}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onTimeUpdate={(e) => {
          if (!isSeeking) setCurrentTime(e.currentTarget.currentTime)
        }}
        onEnded={handleNext}
      />

      {viewMode === 'album' ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-2xl" />
              ))
            : ostItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedAlbum(item)
                    setViewMode('song')
                  }}
                  className="group space-y-2"
                >
                  <div className="relative aspect-square overflow-hidden rounded-2xl shadow-md transition-transform group-hover:-translate-y-1">
                    <img
                      src={item.cover}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <p className="truncate text-center text-xs font-medium">
                    {item.name}
                  </p>
                </button>
              ))}
        </div>
      ) : (
        <div className="grid h-130 grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <div className="order-2 flex flex-col justify-center lg:order-1">
            {selectedSong ? (
              renderCoverPlayer()
            ) : (
              <div className="text-muted-foreground flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-20">
                <p className="text-sm">选择歌曲开始播放</p>
              </div>
            )}
          </div>

          {/* 右侧列表区域 */}
          <div className="order-1 flex min-h-0 flex-col space-y-4 lg:order-2">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setViewMode('album')
                  setIsPlaying(false)
                  audioRef.current?.pause()
                }}
              >
                <ChevronLeft className="size-5" />
              </Button>
              <h3 className="truncate text-sm font-bold">
                {selectedAlbum?.name}
              </h3>
            </div>

            {/* 这里的 ScrollArea 决定了最大高度 */}
            <ScrollArea className="max-h-110 flex-1 overflow-hidden rounded-xl border pr-3">
              <div className="space-y-1 p-1">
                {songs.map((song, i) => {
                  const isSelected = selectedSongIndex === i
                  return (
                    <button
                      key={song.id}
                      onClick={() => {
                        setSelectedSongIndex(i)
                        pendingAutoPlayRef.current = true
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs transition-all duration-300 ${
                        isSelected
                          ? 'font-bold shadow-sm' // 移除 bg-primary，通过 style 设置背景
                          : 'hover:bg-muted opacity-80'
                      }`}
                      // --- 需求(1) 实现：选中背景与播放器一致 ---
                      style={
                        isSelected
                          ? {
                              backgroundColor: hexToRgba(
                                playerColor || '#ffffff',
                                opacity,
                              ),
                              // 如果背景太暗，自动将文字设为白色（可选逻辑）
                              color:
                                resolvedTheme === 'dark' && opacity > 50
                                  ? '#fff'
                                  : 'inherit',
                            }
                          : {}
                      }
                    >
                      <span className="opacity-50">{i + 1}</span>
                      <span className="flex-1 truncate">{song.name}</span>
                    </button>
                  )
                })}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  )
}
