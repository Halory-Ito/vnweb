'use client'

import { ArrowLeftRightIcon, SearchIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Spinner } from '@/components/ui/spinner'
import { getNeteaseAlbumSongs } from '@/lib/ost-utils'

type ConvertDirection = 'khinsider-to-netease' | 'netease-to-khinsider'

type AlbumItem = {
  id: string
  name: string
  cover: string
  songs?: Array<{
    id: number
    name: string
    url: string
    lyricsText?: string
    lyricsPath?: string
  }>
}

type SongConvertDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentOstId: number
  currentOstName: string
  currentSongs: Array<{
    id: number
    name: string
    url: string
    lyricsText: string
    lyricsPath: string
  }>
  onConvertComplete: () => void
}

export function SongConvertDialog({
  open,
  onOpenChange,
  currentOstId,
  currentOstName,
  currentSongs,
  onConvertComplete,
}: SongConvertDialogProps) {
  const [step, setStep] = useState<'direction' | 'search' | 'preview'>(
    'direction',
  )
  const [direction, setDirection] = useState<ConvertDirection | null>(null)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchResults, setSearchResults] = useState<AlbumItem[]>([])
  const [selectedAlbum, setSelectedAlbum] = useState<AlbumItem | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingAlbum, setIsLoadingAlbum] = useState(false)
  const [isConverting, setIsConverting] = useState(false)

  const resetState = () => {
    setStep('direction')
    setDirection(null)
    setSearchKeyword('')
    setSearchResults([])
    setSelectedAlbum(null)
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) resetState()
    onOpenChange(open)
  }

  const handleDirectionSelect = (dir: ConvertDirection) => {
    setDirection(dir)
    setStep('search')
  }

  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      toast.error('请输入搜索关键词')
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(
        `/api/ost/search-convert?keyword=${encodeURIComponent(searchKeyword)}&direction=${direction}`,
      )
      const data = await response.json()

      if (data.error) {
        toast.error(data.error)
        return
      }

      setSearchResults(data.data?.items || [])
    } catch {
      toast.error('搜索失败')
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectAlbum = async (album: AlbumItem) => {
    // 如果是网易云转换，需要先获取专辑中的歌曲列表
    if (direction === 'khinsider-to-netease') {
      setIsLoadingAlbum(true)
      try {
        // 使用工具函数获取网易云专辑的歌曲详情
        const songs = await getNeteaseAlbumSongs(album.id)
        setSelectedAlbum({
          ...album,
          songs,
        })
        setStep('preview')
      } catch {
        toast.error('获取专辑详情失败')
      } finally {
        setIsLoadingAlbum(false)
      }
    } else {
      // Khinsider 转换直接选择
      setSelectedAlbum(album)
      setStep('preview')
    }
  }

  const handleConvert = async () => {
    if (!selectedAlbum || !direction) return

    setIsConverting(true)
    try {
      const response = await fetch(`/api/ost/convert-songs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceOstId: currentOstId,
          targetAlbumId: selectedAlbum.id,
          direction,
          songMapping: currentSongs.map((song, index) => ({
            sourceSongId: song.id,
            targetSongIndex: index,
          })),
        }),
      })

      const data = await response.json()

      if (data.error) {
        toast.error(data.error)
        return
      }

      toast.success(`成功转换 ${data.data?.convertedCount || 0} 首歌曲`)
      handleOpenChange(false)
      onConvertComplete()
    } catch {
      toast.error('转换失败')
    } finally {
      setIsConverting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRightIcon className="size-5" />
            转换歌曲信息
          </DialogTitle>
          <DialogDescription>
            {step === 'direction' && '选择转换方向'}
            {step === 'search' &&
              `从 ${direction === 'khinsider-to-netease' ? '网易云' : 'Khinsider'} 搜索目标专辑`}
            {step === 'preview' && '预览转换结果'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step === 'direction' && (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleDirectionSelect('khinsider-to-netease')}
                className="hover:border-primary hover:bg-primary/5 flex flex-col items-center gap-3 rounded-lg border-2 border-transparent p-6 transition-all"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-600">
                  K
                </div>
                <span className="font-medium">Khinsider → 网易云</span>
                <span className="text-muted-foreground text-center text-xs">
                  用网易云的歌词和专辑信息替换 Khinsider 的歌曲
                </span>
              </button>

              <button
                onClick={() => handleDirectionSelect('netease-to-khinsider')}
                className="hover:border-primary hover:bg-primary/5 flex flex-col items-center gap-3 rounded-lg border-2 border-transparent p-6 transition-all"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-2xl font-bold text-red-600">
                  N
                </div>
                <span className="font-medium">网易云 → Khinsider</span>
                <span className="text-muted-foreground text-center text-xs">
                  用 Khinsider 的免费音源替换网易云的歌曲
                </span>
              </button>
            </div>
          )}

          {step === 'search' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <InputGroup className="flex-1">
                  <InputGroupInput
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSearch()
                    }}
                    placeholder="输入专辑名称搜索..."
                  />
                  <InputGroupAddon>
                    <SearchIcon />
                  </InputGroupAddon>
                </InputGroup>
                <Button onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? <Spinner className="size-4" /> : '搜索'}
                </Button>
              </div>

              <ScrollArea className="h-[300px]">
                {searchResults.length === 0 ? (
                  <div className="text-muted-foreground flex h-40 items-center justify-center">
                    {isSearching ? '搜索中...' : '输入关键词搜索专辑'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {searchResults.map((album) => (
                      <button
                        key={album.id}
                        onClick={() => handleSelectAlbum(album)}
                        disabled={isLoadingAlbum}
                        className="hover:bg-muted flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors disabled:opacity-50"
                      >
                        <img
                          src={album.cover}
                          alt=""
                          className="h-12 w-12 rounded object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{album.name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {step === 'preview' && selectedAlbum && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <img
                  src={selectedAlbum.cover}
                  alt=""
                  className="h-16 w-16 rounded object-cover"
                />
                <div>
                  <p className="font-medium">{selectedAlbum.name}</p>
                  <p className="text-muted-foreground text-xs">
                    当前 OST: {currentOstName} ({currentSongs.length} 首)
                    {selectedAlbum.songs &&
                      ` → 目标专辑 ${selectedAlbum.songs.length} 首`}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border">
                <div className="border-b p-3 font-medium">
                  歌曲对应关系（共 {currentSongs.length} 首）
                </div>
                <ScrollArea className="h-[200px]">
                  <div className="p-3">
                    {currentSongs.map((sourceSong, index) => {
                      const targetSong = selectedAlbum.songs?.[index]
                      return (
                        <div
                          key={sourceSong.id}
                          className="mb-3 flex items-center gap-2 text-sm last:mb-0"
                        >
                          <span className="text-muted-foreground w-6 text-center">
                            {index + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">
                              {sourceSong.name}
                            </p>
                            {targetSong && (
                              <p className="text-muted-foreground truncate">
                                → {targetSong.name}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            {direction === 'khinsider-to-netease' ? (
                              <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700">
                                将获取歌词
                              </span>
                            ) : sourceSong.lyricsText ||
                              targetSong?.lyricsText ? (
                              <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700">
                                歌词
                              </span>
                            ) : (
                              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                                无歌词
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {step === 'direction' && (
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              取消
            </Button>
          )}

          {step === 'search' && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('direction')}>
                上一步
              </Button>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                取消
              </Button>
            </div>
          )}

          {step === 'preview' && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('search')}>
                上一步
              </Button>
              <Button
                onClick={handleConvert}
                disabled={
                  isConverting ||
                  !selectedAlbum ||
                  (direction === 'khinsider-to-netease' &&
                    selectedAlbum.songs?.length !== currentSongs.length)
                }
              >
                {isConverting ? (
                  <>
                    <Spinner className="mr-2 size-4" />
                    转换中...
                  </>
                ) : (
                  '确认转换'
                )}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
