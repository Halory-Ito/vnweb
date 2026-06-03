'use client'

import { useQuery } from '@tanstack/react-query'
import { ImageIcon, Loader2Icon, MusicIcon, SearchIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

import { NETEASE_QUALITY_LABELS } from './types'
import { getAlbumDetails, getNeteaseSongUrls, searchAlbums } from './utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getGameCardList } from '@/lib/game/game-utils'

import type {
  GameOption,
  MusicSource,
  NeteaseQuality,
  UnifiedAlbumDetails,
  UnifiedSearchResult,
} from './types'

type OstFormDialogProps = {
  open: boolean
  editingItem: {
    id: number
    gameId: number
    name: string
    cover?: string
  } | null
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: {
    gameId: number
    name: string
    cover: string
    resource?: string
    songs?: Array<{
      name: string
      url: string
      duration?: string
    }>
  }) => void
}

const defaultForm = {
  gameId: '',
  name: '',
  cover: '',
  searchKeyword: '',
}

export function OstFormDialog({
  open,
  editingItem,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: OstFormDialogProps) {
  const [form, setForm] = useState(defaultForm)
  const [musicSource, setMusicSource] = useState<MusicSource>('khinsider')
  const [searchResults, setSearchResults] = useState<UnifiedSearchResult[]>([])
  const [showSearchResultsDialog, setShowSearchResultsDialog] = useState(false)
  const [albumDetails, setAlbumDetails] = useState<UnifiedAlbumDetails | null>(
    null,
  )
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingAlbum, setIsLoadingAlbum] = useState(false)
  const [neteaseQuality, setNeteaseQuality] = useState<NeteaseQuality>('exhigh')
  const [isLoadingUrls, setIsLoadingUrls] = useState(false)

  const { data: gameCards = [] } = useQuery({
    queryKey: ['game-cards'],
    queryFn: () => getGameCardList(),
  })

  const gameOptions: GameOption[] = gameCards.map((game) => ({
    id: String(game.id),
    label: game.title,
  }))

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (editingItem) {
        setForm({
          gameId: String(editingItem.gameId),
          name: editingItem.name,
          cover: editingItem.cover || '',
          searchKeyword: '',
        })
      } else {
        setForm(defaultForm)
        setMusicSource('khinsider')
      }
      setSearchResults([])
      setAlbumDetails(null)
      setShowSearchResultsDialog(false)
    }
  }, [open, editingItem])

  const handleSearch = async () => {
    const kw = form.searchKeyword.trim()
    if (!kw) return

    setIsSearching(true)
    try {
      const results = await searchAlbums(kw, musicSource)
      setSearchResults(results)
      if (results.length > 0) {
        setShowSearchResultsDialog(true)
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectAlbum = async (album: UnifiedSearchResult) => {
    setShowSearchResultsDialog(false)
    setIsLoadingAlbum(true)
    try {
      const details = await getAlbumDetails(musicSource, album.id)
      setAlbumDetails(details)
      setForm((prev) => ({
        ...prev,
        name: details.name,
        cover: details.cover || album.cover,
      }))
    } catch (error) {
      console.error('Failed to load album:', error)
    } finally {
      setIsLoadingAlbum(false)
    }
  }

  // 获取网易云歌曲真实 URL
  const fetchNeteaseSongUrls = async (
    songs: Array<{
      name: string
      url: string
      neteaseId?: number
      duration?: string
    }>,
  ) => {
    if (!albumDetails || albumDetails.source !== 'netease') return songs

    setIsLoadingUrls(true)
    try {
      // 收集所有歌曲的 ID
      const songIds = songs
        .map((s) => s.neteaseId)
        .filter((id): id is number => !!id)
      if (songIds.length === 0) return songs

      // 获取所有歌曲的真实 URL
      const urls = await getNeteaseSongUrls(songIds, neteaseQuality)
      const urlMap = new Map(urls.map((u) => [u.id, u.url]))

      // 更新歌曲 URL
      return songs.map((song) => {
        if (song.neteaseId && urlMap.has(song.neteaseId)) {
          return { ...song, url: urlMap.get(song.neteaseId)! }
        }
        return song
      })
    } catch (error) {
      console.error('Failed to fetch song urls:', error)
      return songs
    } finally {
      setIsLoadingUrls(false)
    }
  }

  const handleSelectSong = (
    song: { name: string; url: string },
    albumCover: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      name: song.name,
      cover: albumCover || albumDetails?.cover || '',
    }))
  }

  const handleSubmit = async () => {
    const gameId = Number(form.gameId)
    const name = form.name.trim()
    const cover = form.cover.trim()

    if (!Number.isInteger(gameId) || gameId <= 0) return
    if (!name || !cover) return

    // resource 用于标注音源，歌曲列表保存到 game_ost_songs 表
    // 网易云歌曲的 url 保存为 API 路径格式，播放时再获取真实 URL
    const resource = musicSource
    const songs = albumDetails?.songs

    onSubmit({ gameId, name, cover, resource, songs })
  }

  const isValid = form.gameId && form.name.trim() && form.cover.trim()

  return (
    <>
      {/* Search Results Dialog */}
      <Dialog
        open={showSearchResultsDialog}
        onOpenChange={setShowSearchResultsDialog}
      >
        <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>搜索结果</DialogTitle>
            <DialogDescription>
              共找到 {searchResults.length} 个专辑，请选择要添加的专辑
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto py-4">
            <Table className="table-fixed">
              <TableHeader className="bg-background sticky top-0 z-10">
                <TableRow>
                  <TableHead className="w-20">封面</TableHead>
                  <TableHead className="max-w-100">专辑名称</TableHead>
                  {musicSource === 'netease' && (
                    <TableHead className="w-24">艺术家</TableHead>
                  )}
                  <TableHead className="w-24">类型</TableHead>
                  <TableHead className="w-24">年份</TableHead>
                  <TableHead className="w-24 text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {searchResults.map((album) => (
                  <TableRow key={`${album.source}-${album.id}`}>
                    <TableCell>
                      {album.cover ? (
                        <div className="h-12 w-12 overflow-hidden rounded-md border shadow-sm">
                          <img
                            src={album.cover}
                            alt={album.name}
                            className="size-12 object-cover transition-transform hover:scale-105"
                          />
                        </div>
                      ) : (
                        <div className="bg-muted flex size-12 items-center justify-center rounded-md border shadow-sm">
                          <ImageIcon className="text-muted-foreground size-5 opacity-50" />
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <div
                        className="max-w-100 truncate text-sm font-medium"
                        title={album.name}
                      >
                        {album.name}
                      </div>
                    </TableCell>

                    {musicSource === 'netease' && (
                      <TableCell>
                        <span className="text-muted-foreground text-sm">
                          {album.artist || '-'}
                        </span>
                      </TableCell>
                    )}

                    <TableCell>
                      {musicSource === 'khinsider' ? (
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            album.type === 'album'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}
                        >
                          {album.type === 'album' ? 'Album' : 'Soundtrack'}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          {album.songCount ? `${album.songCount} 首` : '-'}
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      <span className="text-muted-foreground text-sm">
                        {album.year || '-'}
                      </span>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={() => void handleSelectAlbum(album)}
                      >
                        选择
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowSearchResultsDialog(false)}
            >
              取消
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Form Dialog */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[85vh] max-w-3xl flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>{editingItem ? '编辑 OST' : '添加 OST'}</DialogTitle>
            <DialogDescription>
              {editingItem ? '修改 OST 信息' : '搜索并添加 OST'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 space-y-6 overflow-y-auto px-1">
            {/* Game Selection */}
            <div className="space-y-2">
              <Label>关联游戏</Label>
              <Select
                value={form.gameId}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, gameId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择游戏" />
                </SelectTrigger>
                <SelectContent>
                  {gameOptions.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!editingItem && (
              <>
                {/* Music Source Selection */}
                <div className="space-y-2">
                  <Label>数据源</Label>
                  <Select
                    value={musicSource}
                    onValueChange={(value) => {
                      setMusicSource(value as MusicSource)
                      // 切换数据源时清空搜索结果
                      setSearchResults([])
                      setAlbumDetails(null)
                    }}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="khinsider">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Khinsider</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="netease">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">网易云音乐</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Search Section */}
                <div className="space-y-3">
                  <Label>
                    搜索 OST
                    <span className="text-muted-foreground ml-2 text-xs">
                      (通过{' '}
                      {musicSource === 'khinsider' ? 'Khinsider' : '网易云音乐'}{' '}
                      搜索)
                    </span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder={
                        musicSource === 'khinsider'
                          ? '输入专辑名称搜索...'
                          : '输入专辑或艺术家名称搜索...'
                      }
                      value={form.searchKeyword}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          searchKeyword: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          void handleSearch()
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => void handleSearch()}
                      disabled={isSearching || !form.searchKeyword.trim()}
                    >
                      {isSearching ? (
                        <Loader2Icon className="size-4 animate-spin" />
                      ) : (
                        <SearchIcon className="size-4" />
                      )}
                      搜索
                    </Button>
                  </div>
                </div>

                {/* No Results Message */}
                {searchResults.length === 0 &&
                  form.searchKeyword.trim() &&
                  !isSearching &&
                  !isLoadingAlbum && (
                    <p className="text-muted-foreground text-sm">
                      未找到相关专辑，请尝试其他关键词
                    </p>
                  )}

                {/* Loading Album */}
                {isLoadingAlbum && (
                  <div className="space-y-3">
                    <Label>加载中...</Label>
                    <div className="text-muted-foreground flex items-center gap-2">
                      <Loader2Icon className="size-4 animate-spin" />
                      <span>正在获取专辑详情...</span>
                    </div>
                  </div>
                )}

                {/* Album Details - Song Selection */}
                {albumDetails && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>选择歌曲</Label>
                      <div className="flex items-center gap-2">
                        {musicSource === 'netease' && (
                          <Select
                            value={neteaseQuality}
                            onValueChange={(value) =>
                              setNeteaseQuality(value as NeteaseQuality)
                            }
                          >
                            <SelectTrigger className="h-8 w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(
                                Object.keys(
                                  NETEASE_QUALITY_LABELS,
                                ) as NeteaseQuality[]
                              ).map((level) => (
                                <SelectItem key={level} value={level}>
                                  {NETEASE_QUALITY_LABELS[level]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setAlbumDetails(null)
                            setSearchResults([])
                          }}
                        >
                          重新搜索
                        </Button>
                      </div>
                    </div>

                    {/* Album Info */}
                    <div className="bg-muted/50 flex items-center gap-3 rounded-lg border p-3">
                      {albumDetails.cover ? (
                        <img
                          src={albumDetails.cover}
                          alt={albumDetails.name}
                          className="size-12 rounded-md object-cover"
                        />
                      ) : (
                        <div className="bg-secondary flex size-12 items-center justify-center rounded-md">
                          <MusicIcon className="text-muted-foreground size-5" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{albumDetails.name}</p>
                        <p className="text-muted-foreground text-sm">
                          {albumDetails.songs.length} 首歌曲
                        </p>
                      </div>
                    </div>

                    {/* Songs List */}
                    <div className="bg-muted/50 max-h-72 overflow-y-auto rounded-lg border">
                      {albumDetails.songs.map((song, idx) => (
                        <button
                          key={`${song.url}-${idx}`}
                          type="button"
                          className={`hover:bg-accent flex w-full items-center gap-3 border-b p-3 text-left last:border-b-0 ${
                            form.name === song.name ? 'bg-accent' : ''
                          }`}
                          onClick={() =>
                            handleSelectSong(song, albumDetails.cover || '')
                          }
                        >
                          <span className="text-muted-foreground w-8 text-sm">
                            {idx + 1}
                          </span>
                          <span className="flex-1 truncate">
                            {song.name}
                            {song.alias && (
                              <span className="text-muted-foreground ml-1 text-xs">
                                ({song.alias})
                              </span>
                            )}
                          </span>
                          {song.duration && (
                            <span className="text-muted-foreground text-sm">
                              {song.duration}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Manual Edit Fields */}
            <div className="space-y-4 border-t pt-6">
              <div className="space-y-2">
                <Label htmlFor="ost-name">OST 名称</Label>
                <Input
                  id="ost-name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="输入 OST 名称"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ost-cover">封面图片</Label>
                <Input
                  id="ost-cover"
                  value={form.cover}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, cover: e.target.value }))
                  }
                  placeholder="输入封面图片 URL"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  保存中...
                </>
              ) : (
                '保存'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
