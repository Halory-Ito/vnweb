'use client'

import {
  ExternalLinkIcon,
  PencilIcon,
  PlayIcon,
  SquareIcon,
  Trash2Icon,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/request-utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import type { OstSongItem } from '@/lib/game/game-utils'

type SongManageContentProps = {
  items: OstSongItem[]
  isLoading: boolean
  isRefetching: boolean
  onEdit: (item: OstSongItem) => void
  onDelete: (item: OstSongItem) => void
  resource?: string
}

export function SongManageContent({
  items,
  isLoading,
  isRefetching,
  onEdit,
  onDelete,
  resource = 'khinsider',
}: SongManageContentProps) {
  const [playingId, setPlayingId] = useState<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
        audioRef.current = null
      }
    }
  }, [])

  // 获取网易云歌曲真实 URL
  const fetchNeteaseSongUrl = async (
    songUrl: string,
    level: string = 'exhigh',
  ) => {
    const match = songUrl.match(/[?&]id=(\d+)/)
    if (!match) return songUrl

    const songId = match[1]
    try {
      const response = await api.get('/ost/netease/song/url', {
        params: { id: songId, level },
      })
      const data = response.data
      if (data.data && data.data.length > 0 && data.data[0].url) {
        return data.data[0].url
      }
      return songUrl
    } catch {
      return songUrl
    }
  }

  const handlePlayToggle = async (item: OstSongItem) => {
    if (playingId === item.id) {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      setPlayingId(null)
    } else {
      if (audioRef.current) {
        audioRef.current.pause()
      }

      let url = item.url

      // 如果是网易云歌曲，需要先获取真实 URL
      if (resource === 'netease' && item.url.includes('/song/url/v1')) {
        url = await fetchNeteaseSongUrl(item.url)
      }

      const audio = new Audio(url)
      audio.onended = () => setPlayingId(null)
      audio.onerror = () => setPlayingId(null)
      audio.play().catch(() => setPlayingId(null))
      audioRef.current = audio
      setPlayingId(item.id)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="text-muted-foreground flex items-center text-sm font-medium">
        <span className="bg-secondary text-secondary-foreground flex h-5 items-center rounded-full px-2.5 text-xs">
          {items.length} 首歌曲
        </span>
        {isRefetching && (
          <span className="ml-2 animate-pulse text-xs opacity-70">
            Refreshing...
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-muted-foreground flex min-h-75 items-center justify-center text-sm">
          暂无歌曲
        </div>
      ) : (
        <div className="bg-card overflow-hidden rounded-xl border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-muted/50 bg-muted/50">
                <TableHead className="w-15 text-center">#</TableHead>
                <TableHead className="text-center">歌曲名称</TableHead>
                <TableHead className="text-center">链接</TableHead>
                <TableHead className="text-center">歌词</TableHead>
                <TableHead className="w-37.5 text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={item.id} className="group">
                  <TableCell className="text-muted-foreground text-center font-mono">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-medium">{item.name}</span>
                      {item.mediaType && (
                        <span className="bg-primary/10 text-primary rounded px-1.5 py-0.5 text-[10px] font-medium tracking-wider uppercase">
                          {item.mediaType}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors"
                          title={item.url}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLinkIcon className="size-4" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          无
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-center gap-1">
                      {item.lyricsText ? (
                        <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                          文本
                        </span>
                      ) : item.lyricsPath ? (
                        <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400">
                          文件
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          无
                        </span>
                      )}
                      {item.lyricsText && (
                        <span
                          className="text-muted-foreground max-w-48 truncate text-center text-[10px]"
                          title={item.lyricsText}
                        >
                          {item.lyricsText.slice(0, 30)}
                          {item.lyricsText.length > 30 ? '...' : ''}
                        </span>
                      )}
                      {item.lyricsPath && !item.lyricsText && (
                        <span
                          className="text-muted-foreground max-w-48 truncate text-center text-[10px]"
                          title={item.lyricsPath}
                        >
                          {item.lyricsPath.split('/').pop() || item.lyricsPath}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="relative flex h-8 w-full items-center justify-center">
                      <div className="absolute flex items-center justify-center gap-2 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                        <Button
                          variant={
                            playingId === item.id ? 'default' : 'secondary'
                          }
                          size="icon"
                          onClick={() => void handlePlayToggle(item)}
                          title={playingId === item.id ? '停止' : '试听'}
                        >
                          {playingId === item.id ? (
                            <SquareIcon />
                          ) : (
                            <PlayIcon />
                          )}
                        </Button>
                        <Button
                          variant="secondary"
                          size="icon"
                          onClick={() => onEdit(item)}
                          title="编辑"
                        >
                          <PencilIcon />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => onDelete(item)}
                          title="删除"
                        >
                          <Trash2Icon />
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
