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
import dynamic from 'next/dynamic'
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { toast } from 'sonner'

import LiveVisualizer from './live-visiualize'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/lib/request-utils'

// --- 工具函数：Hex 转 RGBA ---
const hexToRgba = (hex: string, opacity: number) => {
  if (!hex) return 'rgba(255, 255, 255, 1)'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`
}

// --- 工具函数：歌词解析 ---
export interface LyricLine {
  time: number
  text: string
}

export const parseLrc = (lrc: string): LyricLine[] => {
  const lines = lrc.split('\n')
  const result: LyricLine[] = []
  const timeExp = /\[(\d{2,}):(\d{2})(?:\.(\d{2,3}))?\]/g

  for (const line of lines) {
    timeExp.lastIndex = 0
    let match
    const matches = []
    while ((match = timeExp.exec(line)) !== null) {
      matches.push(match)
    }

    if (matches.length > 0) {
      const text = line.replace(timeExp, '').trim()
      if (text) {
        for (const m of matches) {
          const min = parseInt(m[1], 10)
          const sec = parseInt(m[2], 10)
          const msStr = m[3] || '0'
          const ms = parseInt(msStr.padEnd(3, '0').slice(0, 3), 10)
          result.push({ time: min * 60 + sec + ms / 1000, text })
        }
      }
    }
  }
  return result.sort((a, b) => a.time - b.time)
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
  lyricsText: string
  lyricsPath: string
}

const MODE_KEYS: PlayMode[] = [
  'list-loop',
  'sequence',
  'shuffle',
  'single-loop',
]

const MODE_ICONS: Record<PlayMode, React.ReactNode> = {
  'list-loop': <Repeat className="size-3.5" />,
  sequence: <ListOrdered className="size-3.5" />,
  shuffle: <Shuffle className="size-3.5" />,
  'single-loop': <Repeat1 className="size-3.5" />,
}

const MODE_LABELS: Record<PlayMode, string> = {
  shuffle: '随机',
  sequence: '顺序',
  'list-loop': '列表循环',
  'single-loop': '单曲循环',
}

const MODE_ORDER: PlayMode[] = [
  'list-loop',
  'sequence',
  'shuffle',
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

  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [lyrics, setLyrics] = useState<LyricLine[]>([])

  // 用于获取容器宽度来支持波纹响应式
  const visualizerContainerRef = useRef<HTMLDivElement>(null)
  const [visualizerWidth, setVisualizerWidth] = useState(400)
  const tabListRef = useRef<HTMLDivElement>(null)

  const [playerColor, setPlayerColor] = useState('')

  // 歌词滚动逻辑
  const activeLyricRef = useRef<HTMLParagraphElement>(null)
  const lyricsContainerRef = useRef<HTMLDivElement>(null)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isUserScrolling, setIsUserScrolling] = useState(false)

  const scrollToActiveLyric = useCallback(() => {
    if (activeLyricRef.current && lyricsContainerRef.current) {
      const container = lyricsContainerRef.current
      const activeElement = activeLyricRef.current

      // 计算中心位置：
      // 目标位置 = (歌词距离顶部的距离) - (容器高度的一半) + (歌词高度的一半)
      const targetScrollTop =
        activeElement.offsetTop -
        container.clientHeight / 2 +
        activeElement.clientHeight / 2

      container.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth',
      })
    }
  }, [])

  useEffect(() => {
    // 只有当用户没有在手动滚动时，才执行自动居中
    if (!isUserScrolling && lyrics.length > 0) {
      scrollToActiveLyric()
    }
  }, [currentTime, isUserScrolling, lyrics.length, scrollToActiveLyric])

  // 处理用户滚动行为
  const handleLyricsScroll = useCallback(() => {
    setIsUserScrolling(true)

    // 清除之前的定时器
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }

    // 设置5秒后恢复自动滚动
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false)
    }, 5000)
  }, [])

  // 监听 currentTime 变化时自动滚动
  useEffect(() => {
    if (!isUserScrolling && lyrics.length > 0) {
      scrollToActiveLyric()
    }
  }, [currentTime, isUserScrolling, lyrics.length, scrollToActiveLyric])

  // 点击歌词跳转到对应时间点
  const handleLyricClick = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
      setIsSeeking(false)
    }
  }, [])

  // 组件卸载时清除定时器
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

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
      // 加载完歌曲后，自动播放第一首
      setSelectedSongIndex(0)
      pendingAutoPlayRef.current = true
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

    if (next === selectedSongIndex && songs.length > 0) {
      // 强制重新播放当前歌曲
      if (audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.play().catch(() => setIsPlaying(false))
      }
    } else {
      pendingAutoPlayRef.current = true
      setSelectedSongIndex(next)
    }
  }

  // 获取网易云歌曲真实 URL
  const fetchNeteaseSongUrl = async (
    songUrl: string,
    level: string = 'exhigh',
  ) => {
    // 从 URL 中提取歌曲 ID，例如：/song/url/v1?id=2155422575&level=exhigh
    const match = songUrl.match(/[?&]id=(\d+)/)
    if (!match) return songUrl

    const songId = match[1]
    try {
      const response = await fetch(
        `/api/ost/netease/song/url?id=${songId}&level=${level}`,
      )
      if (!response.ok) return songUrl

      const data = await response.json()
      if (data.data && data.data.length > 0 && data.data[0].url) {
        return data.data[0].url
      }
      return songUrl
    } catch {
      return songUrl
    }
  }

  // 1. 确保音量实时同步，无论如何切换 Tab
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100
    }
  }, [volume, selectedSong]) // 监听 volume 状态和歌曲切换

  useEffect(() => {
    if (selectedSong && pendingAutoPlayRef.current) {
      pendingAutoPlayRef.current = false
      const audio = audioRef.current
      if (audio) {
        setAudioBlob(null)
        setLyrics([])
        setIsUserScrolling(false)

        // 处理歌词：优先使用 lyricsText，其次使用 lyricsPath
        if (selectedSong.lyricsText) {
          setLyrics(parseLrc(selectedSong.lyricsText))
        } else if (selectedSong.lyricsPath) {
          fetch(selectedSong.lyricsPath)
            .then((res) => {
              if (!res.ok) throw new Error('Failed to fetch lyrics')
              return res.text()
            })
            .then((text) => setLyrics(parseLrc(text)))
            .catch((err) => console.warn('获取歌词文件失败:', err))
        }

        // 获取音频 URL：网易云需要先获取真实 URL
        const playSong = (audioUrl: string) => {
          audio.src = audioUrl
          audio
            .play()
            .then(() => setIsPlaying(true))
            .catch(() => setIsPlaying(false))

          // 获取用于波形可视化的 Blob
          fetch(audioUrl)
            .then((res) => {
              const contentType = res.headers.get('content-type')
              if (
                res.ok &&
                (contentType?.includes('audio/') ||
                  contentType?.includes('mpeg') ||
                  audioUrl.endsWith('.mp3'))
              ) {
                return res.blob()
              }
              throw new Error('Not an audio file')
            })
            .then((blob) => setAudioBlob(blob))
            .catch((err) => console.warn('获取音源可视化Blob失败:', err))
        }

        // 检查是否是网易云歌曲
        if (
          selectedAlbum?.resource === 'netease' &&
          selectedSong.url.includes('/song/url/v1')
        ) {
          void fetchNeteaseSongUrl(selectedSong.url).then((realUrl) => {
            playSong(realUrl)
          })
        } else {
          playSong(selectedSong.url)
        }
      }
    }
  }, [selectedSong, selectedAlbum])

  // 专门处理音量的 Effect
  useEffect(() => {
    if (audioRef.current) {
      // 强制同步，不给浏览器任何“淡入”的机会
      audioRef.current.volume = volume / 100
    }
  }, [volume])

  // 当切歌逻辑触发时，手动更新 src 而不是靠 key 自动更新
  useEffect(() => {
    if (selectedSong && audioRef.current) {
      const audio = audioRef.current

      // 如果 src 没变就不重新加载（防止切换 Tab 导致重新播放）
      if (audio.src !== selectedSong.url) {
        // 记录当前是否在播放
        const wasPlaying = isPlaying

        // 获取真实 URL 的逻辑保持不变...
        // playSong 内部直接操作 audio.src
        audio.src = selectedSong.url
        audio.load() // 强制加载新源

        if (wasPlaying) {
          audio.play().catch(() => setIsPlaying(false))
        }
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
                if (playMode === 'shuffle' && songs.length > 1) {
                  while (prev === selectedSongIndex)
                    prev = Math.floor(Math.random() * songs.length)
                } else if (playMode === 'list-loop') {
                  prev = (selectedSongIndex - 1 + songs.length) % songs.length
                } else {
                  prev = Math.max(selectedSongIndex - 1, 0)
                }

                if (prev === selectedSongIndex) {
                  if (audioRef.current) {
                    audioRef.current.currentTime = 0
                    audioRef.current.play().catch(() => setIsPlaying(false))
                  }
                } else {
                  setSelectedSongIndex(prev)
                  pendingAutoPlayRef.current = true
                }
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
              size="icon"
              className="size-8"
              title={MODE_LABELS[playMode]}
              onClick={() => {
                const currentIndex = MODE_ORDER.indexOf(playMode)
                setPlayMode(MODE_ORDER[(currentIndex + 1) % MODE_ORDER.length])
              }}
            >
              {MODE_ICONS[playMode]}
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

  const renderVisualizer = () => {
    return (
      <div className="relative flex h-40 w-full items-center justify-center overflow-hidden rounded-xl border bg-black/5 shadow-inner backdrop-blur-md">
        {/* 背景微弱光晕 */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background: `radial-gradient(circle, ${playerColor} 0%, transparent 70%)`,
          }}
        />

        <LiveVisualizer
          audioRef={audioRef}
          isPlaying={isPlaying}
          color={hasCustomStyle ? playerColor : 'hsl(var(--primary))'}
        />

        {/* 时间显示悬浮窗 */}
        <div className="absolute right-3 bottom-2 rounded bg-black/20 px-2 py-1 font-mono text-[10px] text-white/70 backdrop-blur-sm">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>
    )
  }
  const renderLyrics = () => {
    if (lyrics.length === 0) {
      return (
        <div className="bg-background/40 flex h-64 items-center justify-center rounded-xl border-2 border-dashed text-sm backdrop-blur-md">
          <p className="opacity-50">暂无本地歌词</p>
        </div>
      )
    }

    const activeIndex = lyrics.findIndex((l, i) => {
      const nextTime = lyrics[i + 1]?.time ?? Infinity
      return currentTime >= l.time && currentTime < nextTime
    })

    return (
      <div className="bg-background/50 relative h-64 w-full overflow-hidden rounded-xl border backdrop-blur">
        {/* 顶部和底部的遮罩，让歌词有渐隐效果 */}
        <div className="from-background/80 pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b to-transparent" />
        <div className="from-background/80 pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t to-transparent" />

        <div
          ref={lyricsContainerRef}
          onScroll={handleLyricsScroll}
          className="h-full overflow-y-auto scroll-smooth px-4 py-32 text-center" // py-32 保证最后一句也能滚到中心
        >
          {lyrics.map((line, i) => {
            const isActive = i === activeIndex
            return (
              <p
                key={i}
                ref={isActive ? activeLyricRef : null}
                onClick={() => handleLyricClick(line.time)}
                className={`cursor-pointer py-3 transition-all duration-500 ${
                  isActive
                    ? 'scale-110 text-lg font-bold opacity-100'
                    : 'text-sm opacity-40 hover:opacity-80'
                }`}
                style={
                  isActive
                    ? {
                        color: hasCustomStyle
                          ? playerColor
                          : 'hsl(var(--primary))',
                      }
                    : {}
                }
              >
                {line.text}
              </p>
            )
          })}
        </div>
      </div>
    )
  }

  const renderTabs = () => (
    <Tabs defaultValue="visualizer" className="mt-2 w-full">
      <div ref={tabListRef}>
        <TabsList
          style={{
            backgroundColor: hexToRgba(playerColor || '#ffffff', opacity),
          }}
          className={`grid w-full grid-cols-3`}
        >
          <TabsTrigger value="visualizer">可视化</TabsTrigger>
          <TabsTrigger value="lyrics">歌词</TabsTrigger>
          <TabsTrigger value="all">全部</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="visualizer" className="mt-4">
        {renderVisualizer()}
      </TabsContent>
      <TabsContent value="lyrics" className="mt-4">
        {renderLyrics()}
      </TabsContent>
      <TabsContent value="all" className="mt-4 space-y-4">
        {renderVisualizer()}
        {renderLyrics()}
      </TabsContent>
    </Tabs>
  )

  return (
    <div className="space-y-4">
      <audio
        ref={audioRef}
        // 1. ！！！务必移除 key 属性 ！！！
        // key={selectedSong?.url ?? 'empty'}

        crossOrigin="anonymous"
        onLoadedMetadata={(e) => {
          // 2. 在元数据加载瞬间立即强制同步音量
          e.currentTarget.volume = volume / 100
          setDuration(e.currentTarget.duration || 0)
        }}
        onTimeUpdate={(e) => {
          if (!isSeeking) setCurrentTime(e.currentTarget.currentTime)
        }}
        onEnded={() => {
          if (playMode === 'single-loop') {
            if (audioRef.current) {
              audioRef.current.currentTime = 0
              audioRef.current.play().catch(() => setIsPlaying(false))
            }
          } else if (playMode === 'sequence') {
            if (selectedSongIndex < songs.length - 1) {
              handleNext()
            } else {
              setIsPlaying(false) // 顺序播放到最后一首停止
            }
          } else {
            handleNext()
          }
        }}
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
        <div className="grid max-h-[800px] min-h-[520px] grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <div className="order-2 flex flex-col gap-4 overflow-y-auto pr-2 pb-2 lg:order-1">
            {selectedSong ? (
              <>
                {renderCoverPlayer()}
                {renderTabs()}
              </>
            ) : (
              <div className="text-muted-foreground mt-10 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-20">
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
