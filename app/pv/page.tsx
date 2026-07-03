'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import Hls from 'hls.js'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { PvDeleteDialog } from './_ui/pv-delete-dialog'
import { PvFormDialog } from './_ui/pv-form-dialog'
import { PvManageContent } from './_ui/pv-manage-content'
import { PvPageHeader } from './_ui/pv-page-header'
import { PvPlayerDialog } from './_ui/pv-player-dialog'
import { PvSearchToolbar } from './_ui/pv-search-toolbar'
import {
  getHostname,
  isHlsUrl,
  isSteamVideoUrl,
  isVideoFileUrl,
  isVideoStreamUrl,
} from './_ui/utils'
import {
  createPvManageItem,
  deletePvManageItem,
  getGameCardList,
  getPvManageList,
  type PvManageItem,
  updatePvManageItem,
} from '@/lib/game/game-utils'
import { callHook } from '@/lib/plugins'

import type { GameOption, PvFormState, ViewMode } from './_ui/types'

const defaultForm: PvFormState = {
  gameId: '',
  name: '',
  url: '',
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
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null)
  const hlsRef = useRef<Hls | null>(null)

  const disposeHls = () => {
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }
  }

  const { data: gameCards = [] } = useQuery({
    queryKey: ['game-cards'],
    queryFn: () => getGameCardList(),
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

  const gameOptions = useMemo<GameOption[]>(
    () =>
      gameCards.map((game) => ({
        id: String(game.id),
        label: game.title,
      })),
    [gameCards],
  )

  const [resolvedVideo, setResolvedVideo] = useState<{
    mode: 'direct' | 'embed' | 'none'
    embedUrl: string
    playUrl: string
  }>({ mode: 'none', embedUrl: '', playUrl: '' })

  useEffect(() => {
    const url = playingItem?.url?.trim()
    if (!url) {
      setResolvedVideo({ mode: 'none', embedUrl: '', playUrl: '' })
      return
    }

    // 1. 直链视频文件 → 直接播放
    if (isVideoFileUrl(url)) {
      setResolvedVideo({ mode: 'direct', embedUrl: '', playUrl: url })
      return
    }

    // 2. 视频流（m3u8、mpd等）→ 直接播放
    if (isVideoStreamUrl(url)) {
      setResolvedVideo({ mode: 'direct', embedUrl: '', playUrl: url })
      return
    }

    // 3. Steam 视频链接 → 直接播放
    if (isSteamVideoUrl(url)) {
      setResolvedVideo({ mode: 'direct', embedUrl: '', playUrl: url })
      return
    }

    // 4. 调用插件 Hook 解析（YouTube、Bilibili 等）
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
  }, [playingItem?.url])

  const playingMode = resolvedVideo.mode
  const playingEmbedUrl = resolvedVideo.embedUrl

  useEffect(() => {
    const video = videoEl
    const url = resolvedVideo.playUrl

    // playingItem 为 null 时说明对话框已关闭，不应再初始化视频播放
    if (!playingItem || !video || !url || playingMode !== 'direct') {
      disposeHls()
      return
    }

    disposeHls()

    // Steam 视频需要跨域支持
    const needsCors =
      url.includes('steamstatic.com') ||
      url.includes('steamcdn-a.akamaihd.net') ||
      url.includes('valvesoftware.com')

    // HLS 流（m3u8）
    if (isHlsUrl(url)) {
      // Safari 原生支持 HLS
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        if (video.src !== url) {
          video.crossOrigin = needsCors ? 'anonymous' : null
          video.src = url
          video.load()
          void video.play().catch(() => {})
        }
        return
      }

      // 其他浏览器使用 hls.js
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
      return
    }

    // 普通视频文件
    if (video.src !== url) {
      video.crossOrigin = needsCors ? 'anonymous' : null
      video.src = url
      video.load()
      void video.play().catch(() => {
        // Playback might be blocked by browser until user interact
      })
    }
  }, [playingItem, playingMode, videoEl])

  useEffect(() => {
    return () => {
      disposeHls()
    }
  }, [])

  const handleVideoError = () => {
    const video = videoEl
    const mediaErrorCode = video?.error?.code

    // 1 = MEDIA_ERR_ABORTED, common and benign during source switches/close.
    if (mediaErrorCode === 1) {
      return
    }

    if (mediaErrorCode) {
      toast.error('视频播放失败，请尝试打开原始链接')
    }
  }

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

  const handleSubmit = async (uploadedUrl?: string) => {
    const gameId = Number(form.gameId)
    const name = form.name.trim()
    const url = uploadedUrl || form.url.trim()

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
    <div className="max-h-[calc(100vh-70px)] w-full space-y-6 overflow-x-hidden overflow-y-scroll p-6">
      <PvPageHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onCreate={openCreateDialog}
      />

      <PvSearchToolbar
        keywordInput={keywordInput}
        gameFilter={gameFilter}
        gameOptions={gameOptions}
        onKeywordInputChange={setKeywordInput}
        onGameFilterChange={setGameFilter}
        onSearch={() => setKeyword(keywordInput.trim())}
        onReset={() => {
          setKeywordInput('')
          setKeyword('')
          setGameFilter('all')
          void refetch()
        }}
      />

      <PvManageContent
        items={items}
        isLoading={isLoading}
        isRefetching={isRefetching}
        viewMode={viewMode}
        onPlay={setPlayingItem}
        onEdit={openEditDialog}
        onDelete={setPendingDelete}
      />

      <PvFormDialog
        open={dialogOpen}
        editingItem={editingItem}
        form={form}
        gameOptions={gameOptions}
        isSubmitting={isSubmitting}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            // 延迟清除表单，避免对话框关闭动画期间内容闪烁
            setTimeout(() => {
              setEditingItem(null)
              setForm(defaultForm)
            }, 200)
          }
        }}
        onGameIdChange={(value) =>
          setForm((prev) => ({ ...prev, gameId: value }))
        }
        onNameChange={(value) => setForm((prev) => ({ ...prev, name: value }))}
        onUrlChange={async (value) => {
          setForm((prev) => ({ ...prev, url: value }))
          // 当输入看起来像短链或可解析 URL 时，调用插件 Hook
          if (value.includes('b23.tv/') || value.includes('bilibili.com')) {
            const result = await callHook('pv:resolve-url', { url: value })
            if (result?.resolvedUrl) {
              setForm((prev) => ({
                ...prev,
                url: result.resolvedUrl ?? prev.url,
              }))
              toast.success('链接已自动解析')
            }
          }
        }}
        onSubmit={(uploadedUrl) => void handleSubmit(uploadedUrl)}
      />

      <PvDeleteDialog
        item={pendingDelete}
        isSubmitting={isSubmitting}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDelete(null)
          }
        }}
        onConfirm={() => void handleDelete()}
      />

      <PvPlayerDialog
        item={playingItem}
        mode={playingMode}
        embedUrl={playingEmbedUrl}
        videoRef={setVideoEl}
        onOpenChange={(open) => {
          if (!open) {
            // 暂停视频并清理资源
            if (videoEl) {
              videoEl.pause()
              videoEl.src = ''
            }
            disposeHls()
            setPlayingItem(null)
          }
        }}
        onVideoError={handleVideoError}
      />
    </div>
  )
}
