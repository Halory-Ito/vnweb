'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSetAtom } from 'jotai'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { createOstSong, deleteOstSong, getOstById, getOstSongs, updateOstSong } from '@/api'
import { bgAtom } from '@/atom/global'
import { useRecordVisit } from '@/features/recent'
import {
  getCurrentDeviceBackgroundImage,
  readBackgroundSettings,
} from '@/lib/settings/background-settings'

import type { OstManageItem, OstSongItem } from '@/types'

const getDefaultSettingsBg = () => {
  const settings = readBackgroundSettings()
  const deviceCustom = getCurrentDeviceBackgroundImage(settings)
  if (settings.customBackgroundEnabled && deviceCustom) {
    return deviceCustom
  }
  return settings.lastGameBackgroundImage
}

export function useSongManage(ostId: number) {
  const queryClient = useQueryClient()
  const setBg = useSetAtom(bgAtom)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<OstSongItem | null>(null)
  const [editingItem, setEditingItem] = useState<OstSongItem | null>(null)
  const [lyricPreviewItem, setLyricPreviewItem] = useState<OstSongItem | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [keywordInput, setKeywordInput] = useState('')

  const validOstId = !Number.isNaN(ostId) && ostId > 0

  // 优先从缓存的唱片架列表中读取对应专辑信息，实现跳转首帧即有封面与标题
  const cachedOstItem = useMemo(() => {
    const cached = queryClient.getQueryData<{ items: OstManageItem[] }>(['ost-manage'])
    return cached?.items?.find((item) => item.id === ostId) ?? null
  }, [ostId, queryClient])

  const { data: ostData } = useQuery({
    queryKey: ['ost-detail', ostId],
    queryFn: () => getOstById(ostId),
    enabled: validOstId,
    initialData: cachedOstItem ? { item: cachedOstItem } : undefined,
    initialDataUpdatedAt: cachedOstItem ? Date.now() : undefined,
  })

  useRecordVisit(ostData?.item?.gameId, 'ost', `/ost/${ostId}`)

  const {
    data: songsData,
    isLoading,
    isRefetching,
  } = useQuery({
    queryKey: ['ost-songs', ostId],
    queryFn: () => getOstSongs(ostId),
    enabled: validOstId,
  })

  const ostItem = ostData?.item ?? cachedOstItem
  const allSongs = useMemo(() => songsData?.items ?? [], [songsData?.items])

  // 联动全局背景为当前专辑封面，离开页面时恢复系统默认背景
  useEffect(() => {
    if (ostItem?.cover) {
      setBg(ostItem.cover)
    }
  }, [ostItem?.cover, setBg])

  useEffect(() => {
    return () => {
      setBg(getDefaultSettingsBg())
    }
  }, [setBg])

  const filteredItems = useMemo(() => {
    const kw = keywordInput.trim().toLowerCase()
    if (!kw) return allSongs
    return allSongs.filter((item) => item.name.toLowerCase().includes(kw))
  }, [allSongs, keywordInput])

  const openCreateDialog = useCallback(() => {
    setEditingItem(null)
    setDialogOpen(true)
  }, [])

  const openEditDialog = useCallback((item: OstSongItem) => {
    setEditingItem(item)
    setDialogOpen(true)
  }, [])

  const handleDialogOpenChange = useCallback((open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setEditingItem(null)
    }
  }, [])

  const handleSubmit = useCallback(
    async (data: {
      name: string
      url: string
      mediaType?: string
      lyricsText?: string
      lyricsPath?: string
    }) => {
      if (!data.name.trim() || !data.url.trim()) {
        toast.error('歌曲名称和 URL 不能为空')
        return
      }
      if (!ostItem) {
        toast.error('OST 信息获取失败，无法保存歌曲')
        return
      }

      setIsSubmitting(true)
      try {
        if (editingItem) {
          await updateOstSong(editingItem.id, {
            name: data.name.trim(),
            url: data.url.trim(),
            mediaType: data.mediaType?.trim() || '',
            lyricsText: data.lyricsText?.trim() || '',
            lyricsPath: data.lyricsPath?.trim() || '',
          })
          toast.success('歌曲已更新')
        } else {
          await createOstSong({
            gameId: ostItem.gameId,
            ostId,
            name: data.name.trim(),
            url: data.url.trim(),
            mediaType: data.mediaType?.trim() || '',
            lyricsText: data.lyricsText?.trim() || '',
            lyricsPath: data.lyricsPath?.trim() || '',
          })
          toast.success('歌曲已添加')
        }
        setDialogOpen(false)
        setEditingItem(null)
        await queryClient.invalidateQueries({ queryKey: ['ost-songs', ostId] })
      } catch (error) {
        const err = error as { response?: { data?: { error?: string } }; message?: string }
        toast.error(err.response?.data?.error || err.message || '保存歌曲失败')
      } finally {
        setIsSubmitting(false)
      }
    },
    [editingItem, ostId, ostItem, queryClient],
  )

  const handleDelete = useCallback(async () => {
    if (!pendingDelete) return
    setIsSubmitting(true)
    try {
      await deleteOstSong(pendingDelete.id)
      toast.success('歌曲已删除')
      setPendingDelete(null)
      await queryClient.invalidateQueries({ queryKey: ['ost-songs', ostId] })
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } }; message?: string }
      toast.error(err.response?.data?.error || err.message || '删除歌曲失败')
    } finally {
      setIsSubmitting(false)
    }
  }, [pendingDelete, ostId, queryClient])

  return {
    ostItem,
    allSongs,
    filteredItems,
    isLoading,
    isRefetching,
    keywordInput,
    setKeywordInput,
    dialogOpen,
    pendingDelete,
    setPendingDelete,
    editingItem,
    lyricPreviewItem,
    setLyricPreviewItem,
    isSubmitting,
    openCreateDialog,
    openEditDialog,
    handleDialogOpenChange,
    handleSubmit,
    handleDelete,
    refreshSongs: () => void queryClient.invalidateQueries({ queryKey: ['ost-songs', ostId] }),
  }
}
