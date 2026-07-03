'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import Hls from 'hls.js'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { isHlsUrl, isVideoFileUrl } from '@/app/pv/_ui/utils'
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
import { Skeleton } from '@/components/ui/skeleton'
import {
  getGameById,
  getGamePvsById,
  syncSteamPvsByGameId,
  type GameMediaLinkItem,
} from '@/lib/game/game-utils'
import { callHook } from '@/lib/plugins'

type GamePVProps = {
  gameId: number
}

export default function GamePV({ gameId }: GamePVProps) {
  const queryClient = useQueryClient()
  const [items, setItems] = useState<GameMediaLinkItem[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [bindDialogOpen, setBindDialogOpen] = useState(false)
  const [bindPromptDismissed, setBindPromptDismissed] = useState(false)
  const [steamIdInput, setSteamIdInput] = useState('')
  const [isBinding, setIsBinding] = useState(false)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const hlsRef = useRef<Hls | null>(null)

  const disposeHls = () => {
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }
  }

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['game-pvs', gameId],
    queryFn: () => getGamePvsById(gameId),
    enabled: Boolean(gameId),
  })

  const { data: gameDetail } = useQuery({
    queryKey: ['game', String(gameId)],
    queryFn: () => getGameById(String(gameId)),
    enabled: Boolean(gameId),
  })

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  )

  const [resolvedVideo, setResolvedVideo] = useState<{
    mode: 'direct' | 'embed' | 'none'
    embedUrl: string
    playUrl: string
  }>({ mode: 'none', embedUrl: '', playUrl: '' })

  useEffect(() => {
    const url = selectedItem?.url?.trim()
    if (!url) {
      setResolvedVideo({ mode: 'none', embedUrl: '', playUrl: '' })
      return
    }

    if (isVideoFileUrl(url) || isHlsUrl(url)) {
      setResolvedVideo({ mode: 'direct', embedUrl: '', playUrl: url })
      return
    }

    let cancelled = false
    void callHook('pv:video-resolve', { url }).then((result) => {
      if (cancelled) return
      if (result?.embedUrl) {
        setResolvedVideo({
          mode: 'embed',
          embedUrl: result.embedUrl,
          playUrl: '',
        })
      } else if (result?.resolvedUrl) {
        setResolvedVideo({
          mode: 'direct',
          embedUrl: '',
          playUrl: result.resolvedUrl,
        })
      } else {
        setResolvedVideo({ mode: 'none', embedUrl: '', playUrl: '' })
      }
    })

    return () => {
      cancelled = true
    }
  }, [selectedItem?.url])

  const playingMode = resolvedVideo.mode
  const playingEmbedUrl = resolvedVideo.embedUrl

  useEffect(() => {
    setItems(data?.items ?? [])
  }, [data])

  const hasSteamBinding = useMemo(() => {
    const sourceIds = gameDetail?.externalSourceIds || ''
    if (!sourceIds) {
      return false
    }

    return sourceIds
      .split(';')
      .map((segment) => segment.trim())
      .filter(Boolean)
      .some((item) => {
        const divider = item.indexOf(':')
        if (divider <= 0 || divider >= item.length - 1) {
          return false
        }

        const provider = item.slice(0, divider).trim().toLowerCase()
        const externalId = item.slice(divider + 1).trim()
        return provider === 'steam' && /^\d+$/.test(externalId)
      })
  }, [gameDetail?.externalSourceIds])

  useEffect(() => {
    if (!error) {
      return
    }

    const err = error as {
      response?: { data?: { error?: string } }
      message?: string
    }
    toast.error(err.response?.data?.error || err.message || '加载PV失败')
  }, [error])

  useEffect(() => {
    if (items.length === 0) {
      setSelectedId(null)
      return
    }

    setSelectedId((prev) => {
      if (prev !== null && items.some((item) => item.id === prev)) {
        return prev
      }
      return items[0].id
    })
  }, [items])

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = 0.5 // 设置默认音量为 50%
    }
  }, [])

  // 移除自动弹窗逻辑，不再在游戏没有绑定Steam AppID时提示用户

  useEffect(() => {
    const video = videoRef.current
    const url = resolvedVideo.playUrl

    if (!video || !url || playingMode !== 'direct') {
      // 暂停视频并清理
      if (video) {
        video.pause()
        video.removeAttribute('src')
      }
      disposeHls()
      return
    }

    // 先暂停当前视频
    video.pause()
    disposeHls()

    // Steam 视频需要跨域支持
    const needsCors =
      url.includes('steamstatic.com') ||
      url.includes('steamcdn-a.akamaihd.net')

    if (!isHlsUrl(url)) {
      if (video.src !== url) {
        video.crossOrigin = needsCors ? 'anonymous' : null
        video.src = url
        video.load()
        void video.play().catch(() => {})
      }
      return
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      if (video.src !== url) {
        video.crossOrigin = needsCors ? 'anonymous' : null
        video.src = url
        video.load()
        void video.play().catch(() => {})
      }
      return
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        xhrSetup: (xhr) => {
          if (needsCors) {
            xhr.withCredentials = false
          }
        },
      })
      hlsRef.current = hls
      hls.loadSource(url)
      hls.attachMedia(video)

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        void video.play().catch(() => {})
      })

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal && video.isConnected) {
          toast.error('HLS 视频播放失败，请稍后重试')
        }
      })

      return () => {
        disposeHls()
      }
    }

    toast.error('当前浏览器不支持 HLS 播放')
  }, [selectedItem, playingMode])

  useEffect(() => {
    return () => {
      // 组件卸载时暂停视频并清理资源
      if (videoRef.current) {
        videoRef.current.pause()
        videoRef.current.removeAttribute('src')
      }
      disposeHls()
    }
  }, [])

  const handleConfirmBindSteamId = async () => {
    const raw = steamIdInput.trim()
    const appId = /^\d+$/.test(raw) ? Number(raw) : NaN

    if (!Number.isInteger(appId) || appId <= 0) {
      toast.error('Steam AppID 格式错误，应为纯数字')
      return
    }

    setIsBinding(true)
    try {
      const result = await syncSteamPvsByGameId(gameId, {
        steamAppId: appId,
      })

      await queryClient.invalidateQueries({
        queryKey: ['game', String(gameId)],
      })
      await refetch()
      setBindDialogOpen(false)
      setBindPromptDismissed(false)

      if (result.inserted > 0) {
        toast.success(`已同步 ${result.inserted} 条 Steam PV`)
      } else if (result.total > 0) {
        toast.info('Steam PV 已存在，无需重复入库')
      } else {
        toast.info('Steam 未返回可用 PV')
      }
    } catch (bindError) {
      const err = bindError as {
        response?: { data?: { error?: string } }
        message?: string
      }
      toast.error(
        err.response?.data?.error || err.message || '绑定 Steam 并同步 PV 失败',
      )
    } finally {
      setIsBinding(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="space-y-3 rounded-md border p-3">
        {/* <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isLoading || isRefetching}
            onClick={() => {
              void refetch()
            }}
          >
            刷新
          </Button>
        </div> */}

        <div className="max-h-105 space-y-2 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : items.length === 0 ? (
            <div className="space-y-2">
              <div className="text-muted-foreground text-sm">暂无PV</div>
              {!hasSteamBinding ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setBindPromptDismissed(false)
                    setBindDialogOpen(true)
                  }}
                >
                  绑定 Steam AppID 并获取 PV
                </Button>
              ) : null}
            </div>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                  selectedId === item.id
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

      <div className="space-y-3 rounded-md border p-3">
        {selectedItem ? (
          playingMode === 'embed' ? (
            <iframe
              key={selectedItem.id}
              src={playingEmbedUrl || undefined}
              title={selectedItem.name || 'PV 播放'}
              className="aspect-video w-full rounded-md border bg-black object-contain"
              frameBorder="0"
              scrolling="no"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          ) : (
            <video
              ref={videoRef}
              key={selectedItem.id}
              controls
              preload="metadata"
              className="aspect-video h-auto w-full rounded-md border bg-black object-contain"
            />
          )
        ) : (
          <div className="text-muted-foreground flex min-h-60 items-center justify-center rounded-md border text-sm">
            请选择一个 PV 进行播放
          </div>
        )}
      </div>

      <Dialog
        open={bindDialogOpen}
        onOpenChange={(open) => {
          setBindDialogOpen(open)
          if (!open && !isBinding) {
            setBindPromptDismissed(true)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>绑定 Steam AppID</DialogTitle>
            <DialogDescription>
              当前游戏暂无 PV 且未绑定 Steam，是否现在绑定并自动同步 PV？
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <div className="text-sm">Steam AppID</div>
            <Input
              value={steamIdInput}
              onChange={(event) => setSteamIdInput(event.target.value)}
              placeholder="例如：412830"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isBinding}
              onClick={() => {
                setBindDialogOpen(false)
                setBindPromptDismissed(true)
              }}
            >
              取消
            </Button>
            <Button
              type="button"
              disabled={isBinding}
              onClick={() => void handleConfirmBindSteamId()}
            >
              {isBinding ? '同步中...' : '确定'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
