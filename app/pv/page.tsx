'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import Hls from 'hls.js'
import {
  Grid2X2Icon,
  ExternalLinkIcon,
  ListIcon,
  PencilIcon,
  PlayCircleIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  createPvManageItem,
  deletePvManageItem,
  getGameCardList,
  getPvManageList,
  type PvManageItem,
  updatePvManageItem,
} from '@/lib/game-utils'

type PvFormState = {
  gameId: string
  name: string
  url: string
}

type ViewMode = 'grid' | 'list'

const defaultForm: PvFormState = {
  gameId: '',
  name: '',
  url: '',
}

const toDisplayDate = (value: string | null) => {
  if (!value) {
    return '-'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '-'
  }
  return date.toLocaleString('zh-CN', { hour12: false })
}

const getHostname = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return '未知来源'
  }
}

const getYouTubeCover = (url: string) => {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/i,
    /youtu\.be\/([^?&/]+)/i,
    /youtube\.com\/shorts\/([^?&/]+)/i,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match?.[1]) {
      return `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg`
    }
  }

  return ''
}

const isHlsUrl = (url: string) => /\.m3u8(?:$|[?#])/i.test(url)

const toYouTubeEmbedUrl = (url: string) => {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/i,
    /youtu\.be\/([^?&/]+)/i,
    /youtube\.com\/shorts\/([^?&/]+)/i,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match?.[1]) {
      return `https://www.youtube.com/embed/${match[1]}`
    }
  }

  return ''
}

const toBilibiliEmbedUrl = (url: string) => {
  const bvMatch = url.match(/\/video\/(BV[\w]+)/i)
  if (bvMatch?.[1]) {
    return `https://player.bilibili.com/player.html?bvid=${bvMatch[1]}&autoplay=0`
  }

  const avMatch = url.match(/\/video\/av(\d+)/i)
  if (avMatch?.[1]) {
    return `https://player.bilibili.com/player.html?aid=${avMatch[1]}&autoplay=0`
  }

  return ''
}

export default function PVPage() {
  const queryClient = useQueryClient()
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [gameFilter, setGameFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<PvManageItem | null>(null)
  const [editingItem, setEditingItem] = useState<PvManageItem | null>(null)
  const [playingItem, setPlayingItem] = useState<PvManageItem | null>(null)
  const [form, setForm] = useState<PvFormState>(defaultForm)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const hlsRef = useRef<Hls | null>(null)

  const disposeHls = () => {
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }
  }

  const { data: gameCards = [] } = useQuery({
    queryKey: ['game-cards'],
    queryFn: getGameCardList,
  })

  const {
    data: pvData,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['pv-manage', keyword, gameFilter],
    queryFn: () =>
      getPvManageList({
        keyword,
        gameId: gameFilter === 'all' ? undefined : Number(gameFilter),
      }),
  })

  const items = pvData?.items ?? []

  const playingMode = useMemo(() => {
    if (!playingItem?.url) {
      return 'none' as const
    }

    if (
      toYouTubeEmbedUrl(playingItem.url) ||
      toBilibiliEmbedUrl(playingItem.url)
    ) {
      return 'embed' as const
    }

    return 'direct' as const
  }, [playingItem])

  const playingEmbedUrl = useMemo(() => {
    if (!playingItem?.url) {
      return ''
    }
    return (
      toYouTubeEmbedUrl(playingItem.url) || toBilibiliEmbedUrl(playingItem.url)
    )
  }, [playingItem])

  useEffect(() => {
    const video = videoRef.current
    const url = playingItem?.url?.trim()

    if (!video || !url || playingMode !== 'direct') {
      disposeHls()
      return
    }

    disposeHls()

    if (!isHlsUrl(url)) {
      if (video.src !== url) {
        video.src = url
      }
      return
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      if (video.src !== url) {
        video.src = url
      }
      return
    }

    if (Hls.isSupported()) {
      const hls = new Hls()
      hlsRef.current = hls
      hls.loadSource(url)
      hls.attachMedia(video)

      hls.on(Hls.Events.ERROR, (_event, data) => {
        // Ignore lifecycle-related aborts when dialog/source is switched quickly.
        if (data.fatal && video.isConnected) {
          toast.error('HLS 视频播放失败，请稍后重试')
        }
      })

      return () => {
        disposeHls()
      }
    }

    toast.error('当前浏览器不支持 HLS 播放')
  }, [playingItem, playingMode])

  useEffect(() => {
    return () => {
      disposeHls()
    }
  }, [])

  const handleVideoError = () => {
    const video = videoRef.current
    const mediaErrorCode = video?.error?.code

    // 1 = MEDIA_ERR_ABORTED, common and benign during source switches/close.
    if (mediaErrorCode === 1) {
      return
    }

    if (mediaErrorCode) {
      toast.error('视频播放失败，请尝试打开原始链接')
    }
  }

  const gameOptions = useMemo(
    () =>
      gameCards.map((game) => ({
        id: game.id,
        label: game.title,
      })),
    [gameCards],
  )

  const openCreateDialog = () => {
    setEditingItem(null)
    setForm(defaultForm)
    setDialogOpen(true)
  }

  const openEditDialog = (item: PvManageItem) => {
    setEditingItem(item)
    setForm({
      gameId: String(item.gameId),
      name: item.name,
      url: item.url,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    const gameId = Number(form.gameId)
    const name = form.name.trim()
    const url = form.url.trim()

    if (!Number.isInteger(gameId) || gameId <= 0) {
      toast.error('请选择游戏')
      return
    }

    if (!name || !url) {
      toast.error('PV 名称和链接不能为空')
      return
    }

    setIsSubmitting(true)
    try {
      if (editingItem) {
        await updatePvManageItem(editingItem.id, {
          gameId,
          name,
          url,
        })
        toast.success('PV 已更新')
      } else {
        await createPvManageItem({
          gameId,
          name,
          url,
        })
        toast.success('PV 已创建')
      }

      setDialogOpen(false)
      setEditingItem(null)
      setForm(defaultForm)
      await queryClient.invalidateQueries({ queryKey: ['pv-manage'] })
      await queryClient.invalidateQueries({ queryKey: ['game-pvs'] })
      await queryClient.invalidateQueries({ queryKey: ['game'] })
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: string } }
        message?: string
      }
      toast.error(err.response?.data?.error || err.message || '保存 PV 失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!pendingDelete) {
      return
    }

    setIsSubmitting(true)
    try {
      await deletePvManageItem(pendingDelete.id)
      toast.success('PV 已删除')
      setPendingDelete(null)
      await queryClient.invalidateQueries({ queryKey: ['pv-manage'] })
      await queryClient.invalidateQueries({ queryKey: ['game-pvs'] })
      await queryClient.invalidateQueries({ queryKey: ['game'] })
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: string } }
        message?: string
      }
      toast.error(err.response?.data?.error || err.message || '删除 PV 失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-h-[calc(100vh-70px)] w-full space-y-4 overflow-y-auto p-4">
      <div className="bg-background/70 flex flex-col gap-3 rounded-xl border p-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">PV 管理</h1>
          <p className="text-muted-foreground text-sm">
            统一管理所有游戏的 PV 资源（game_pv）
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => {
              if (value === 'grid' || value === 'list') {
                setViewMode(value)
              }
            }}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="grid" aria-label="网格模式">
              <Grid2X2Icon className="size-4" />
              网格
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="列表模式">
              <ListIcon className="size-4" />
              列表
            </ToggleGroupItem>
          </ToggleGroup>

          <Button type="button" onClick={openCreateDialog}>
            <PlusIcon className="size-4" />
            新增 PV
          </Button>
        </div>
      </div>

      <div className="bg-background/70 grid grid-cols-1 gap-3 rounded-xl border p-3 md:grid-cols-[1fr_220px_auto]">
        <Input
          placeholder="搜索游戏名 / PV 名称 / 链接"
          value={keywordInput}
          onChange={(event) => setKeywordInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              setKeyword(keywordInput.trim())
            }
          }}
        />

        <Select value={gameFilter} onValueChange={setGameFilter}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="按游戏筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部游戏</SelectItem>
            {gameOptions.map((game) => (
              <SelectItem key={game.id} value={game.id}>
                {game.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setKeyword(keywordInput.trim())}
          >
            搜索
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setKeywordInput('')
              setKeyword('')
              setGameFilter('all')
              void refetch()
            }}
          >
            重置
          </Button>
        </div>
      </div>

      <div className="bg-background/70 rounded-xl border p-3">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-muted-foreground text-sm">
            共 {items.length} 条记录 {isRefetching ? '（刷新中）' : ''}，当前为
            {viewMode === 'grid' ? '网格模式' : '列表模式'}
          </div>
        </div>

        {viewMode === 'list' ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead className="min-w-45">游戏</TableHead>
                <TableHead className="min-w-45">PV 名称</TableHead>
                <TableHead className="min-w-[320px]">链接</TableHead>
                <TableHead className="min-w-45">更新时间</TableHead>
                <TableHead className="w-36 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-muted-foreground text-center"
                  >
                    加载中...
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-muted-foreground text-center"
                  >
                    暂无数据
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.id}</TableCell>
                    <TableCell>{item.gameNameCn || item.gameName}</TableCell>
                    <TableCell className="max-w-65 truncate" title={item.name}>
                      {item.name}
                    </TableCell>
                    <TableCell className="max-w-105">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary inline-flex max-w-full items-center gap-1 truncate hover:underline"
                        title={item.url}
                      >
                        {item.url}
                        <ExternalLinkIcon className="size-3 shrink-0" />
                      </a>
                    </TableCell>
                    <TableCell>{toDisplayDate(item.updatedAt)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(item)}
                        >
                          <PencilIcon className="size-4" />
                          编辑
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => setPendingDelete(item)}
                        >
                          <Trash2Icon className="size-4" />
                          删除
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        ) : isLoading ? (
          <div className="text-muted-foreground py-12 text-center">
            加载中...
          </div>
        ) : items.length === 0 ? (
          <div className="text-muted-foreground py-12 text-center">
            暂无数据
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {items.map((item) => {
              const videoHost = getHostname(item.url)
              const coverUrl = getYouTubeCover(item.url)
              const fallbackCover = item.gameBg || item.gameCover || ''
              const previewCover = coverUrl || fallbackCover

              return (
                <Card
                  key={item.id}
                  variant="default"
                  className="gap-4 overflow-hidden py-0"
                >
                  <button
                    type="button"
                    className="group relative block aspect-video w-full overflow-hidden text-left"
                    onClick={() => setPlayingItem(item)}
                  >
                    {previewCover ? (
                      <img
                        src={previewCover}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="from-muted/60 to-muted flex h-full w-full items-center justify-center bg-linear-to-br">
                        <PlayCircleIcon className="text-primary/80 size-12" />
                      </div>
                    )}
                    <div className="absolute right-2 bottom-2 rounded-full bg-black/70 px-2 py-0.5 text-xs text-white">
                      {videoHost}
                    </div>
                  </button>

                  <CardContent className="space-y-2 px-4">
                    <div
                      className="line-clamp-2 text-sm font-medium"
                      title={item.name}
                    >
                      {item.name}
                    </div>
                    <div
                      className="text-muted-foreground line-clamp-1 text-xs"
                      title={item.gameNameCn || item.gameName}
                    >
                      {item.gameNameCn || item.gameName}
                    </div>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary inline-flex max-w-full items-center gap-1 truncate text-xs hover:underline"
                      title={item.url}
                    >
                      {item.url}
                      <ExternalLinkIcon className="size-3 shrink-0" />
                    </a>
                  </CardContent>

                  <CardFooter className="flex items-center justify-between border-t px-4 py-3">
                    <div className="text-muted-foreground text-xs">
                      {toDisplayDate(item.updatedAt)}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setPlayingItem(item)}
                      >
                        <PlayCircleIcon className="size-4" />
                        播放
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(item)}
                      >
                        <PencilIcon className="size-4" />
                        编辑
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => setPendingDelete(item)}
                      >
                        <Trash2Icon className="size-4" />
                        删除
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            setEditingItem(null)
            setForm(defaultForm)
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? '编辑 PV' : '新增 PV'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <div className="text-sm font-medium">游戏</div>
              <Select
                value={form.gameId}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, gameId: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="请选择游戏" />
                </SelectTrigger>
                <SelectContent>
                  {gameOptions.map((game) => (
                    <SelectItem key={game.id} value={game.id}>
                      {game.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">PV 名称</div>
              <Input
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="请输入 PV 名称"
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">PV 链接</div>
              <Input
                value={form.url}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, url: event.target.value }))
                }
                placeholder="请输入可访问链接"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={isSubmitting}
            >
              {isSubmitting ? '提交中...' : editingItem ? '保存修改' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDelete(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除 PV</AlertDialogTitle>
            <AlertDialogDescription>
              确定删除「{pendingDelete?.name || ''}」吗？该操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>取消</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isSubmitting}
              onClick={(event) => {
                event.preventDefault()
                void handleDelete()
              }}
            >
              {isSubmitting ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={Boolean(playingItem)}
        onOpenChange={(open) => {
          if (!open) {
            setPlayingItem(null)
          }
        }}
      >
        <DialogContent className="w-[92vw] max-w-5xl">
          <DialogHeader>
            <DialogTitle>{playingItem?.name || '播放 PV'}</DialogTitle>
          </DialogHeader>

          {playingMode === 'direct' ? (
            <video
              ref={videoRef}
              key={playingItem?.id ?? 'pv-player'}
              controls
              preload="metadata"
              onError={handleVideoError}
              poster={
                playingItem
                  ? getYouTubeCover(playingItem.url) ||
                    playingItem.gameBg ||
                    playingItem.gameCover ||
                    undefined
                  : undefined
              }
              className="aspect-video w-full rounded-lg bg-black"
            />
          ) : null}

          {playingMode === 'embed' ? (
            <div className="aspect-video w-full overflow-hidden rounded-lg border">
              <iframe
                title={playingItem?.name || 'PV 播放'}
                src={playingEmbedUrl}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : null}

          {playingMode === 'none' && playingItem ? (
            <div className="text-muted-foreground space-y-2 rounded-lg border p-4 text-sm">
              <div>当前链接暂不支持站内播放，请在新窗口打开观看。</div>
              <a
                href={playingItem.url}
                target="_blank"
                rel="noreferrer"
                className="text-primary inline-flex items-center gap-1 hover:underline"
              >
                打开原始链接
                <ExternalLinkIcon className="size-3" />
              </a>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
