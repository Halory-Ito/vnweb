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
  isEmbedVideoUrl,
  isHlsUrl,
  toBilibiliEmbedUrl,
  toYouTubeEmbedUrl,
} from './_ui/utils'
import {
  createPvManageItem,
  deletePvManageItem,
  getGameCardList,
  getPvManageList,
  type PvManageItem,
  updatePvManageItem,
} from '@/lib/game/game-utils'

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

  const playingMode = useMemo(() => {
    if (!playingItem?.url) {
      return 'none' as const
    }

    if (isEmbedVideoUrl(playingItem.url)) {
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
    const video = videoEl
    const url = playingItem?.url?.trim()

    if (!video || !url || playingMode !== 'direct') {
      disposeHls()
      return
    }

    disposeHls()

    if (!isHlsUrl(url)) {
      if (video.src !== url) {
        // Handle steam movie URLs that might need crossOrigin
        if (url.includes('steamstatic.com')) {
          video.crossOrigin = 'anonymous'
        } else {
          video.crossOrigin = null
        }
        video.src = url
        video.load()
        void video.play().catch(() => {
          // Playback might be blocked by browser until user interacts
        })
      }
      return
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      if (video.src !== url) {
        video.crossOrigin = null
        video.src = url
        video.load()
        void video.play().catch(() => {})
      }
      return
    }

    if (Hls.isSupported()) {
      const hls = new Hls()
      hlsRef.current = hls
      hls.loadSource(url)
      hls.attachMedia(video)

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        void video.play().catch(() => {})
      })

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
    <div className="max-h-[calc(100vh-70px)] w-full space-y-4 overflow-x-hidden overflow-y-scroll p-4">
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
            setEditingItem(null)
            setForm(defaultForm)
          }
        }}
        onGameIdChange={(value) =>
          setForm((prev) => ({ ...prev, gameId: value }))
        }
        onNameChange={(value) => setForm((prev) => ({ ...prev, name: value }))}
        onUrlChange={(value) => setForm((prev) => ({ ...prev, url: value }))}
        onSubmit={() => void handleSubmit()}
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
            setPlayingItem(null)
          }
        }}
        onVideoError={handleVideoError}
      />
    </div>
  )
}
