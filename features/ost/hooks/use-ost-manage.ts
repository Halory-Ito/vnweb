'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSetAtom } from 'jotai'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import {
  createOstManageItem,
  deleteOstManageItem,
  getOstManageList,
  updateOstManageItem,
} from '@/api'
import { bgAtom } from '@/atom/global'
import { api } from '@/lib/request-utils'
import {
  getCurrentDeviceBackgroundImage,
  readBackgroundSettings,
} from '@/lib/settings/background-settings'

import type { OstItem } from '@/features/ost/types'
import type { OstManageItem } from '@/types'

const transformItems = (items: OstManageItem[]): OstItem[] =>
  items.map((item) => ({
    id: item.id,
    gameId: item.gameId,
    name: item.name,
    cover: item.cover,
    resource: item.resource,
    createdAt: item.createdAt ?? undefined,
    updatedAt: item.updatedAt ?? undefined,
    gameName: item.gameName,
    gameNameCn: item.gameNameCn,
  }))

const getDefaultSettingsBg = () => {
  const settings = readBackgroundSettings()
  const deviceCustom = getCurrentDeviceBackgroundImage(settings)
  if (settings.customBackgroundEnabled && deviceCustom) {
    return deviceCustom
  }
  return settings.lastGameBackgroundImage
}

export function useOstManage() {
  const queryClient = useQueryClient()
  const setBg = useSetAtom(bgAtom)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<OstItem | null>(null)
  const [editingItem, setEditingItem] = useState<OstItem | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [keywordInput, setKeywordInputState] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSizeState] = useState(18)

  const {
    data: ostData,
    isLoading,
    isRefetching,
  } = useQuery({
    queryKey: ['ost-manage'],
    queryFn: () => getOstManageList(),
  })

  useEffect(() => {
    const syncCovers = async () => {
      try {
        await api.patch('/ost')
      } catch {
        // 静默失败，不打扰用户
      }
    }
    void syncCovers()
  }, [])

  const allItems = useMemo(() => {
    const raw = ostData?.items ?? []
    const kw = keywordInput.trim().toLowerCase()
    const filtered = kw
      ? raw.filter(
          (item) =>
            item.name.toLowerCase().includes(kw) ||
            item.gameName?.toLowerCase().includes(kw) ||
            item.gameNameCn?.toLowerCase().includes(kw),
        )
      : raw
    return transformItems(filtered)
  }, [keywordInput, ostData?.items])

  const total = allItems.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, totalPages)
  const items = useMemo(
    () => allItems.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [allItems, currentPage, pageSize],
  )

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? items[0] ?? null,
    [items, selectedId],
  )

  // 选中唱片变化时同步全局背景为唱片封面；离开页面时恢复系统设置背景
  useEffect(() => {
    if (selectedItem?.cover) {
      setBg(selectedItem.cover)
    } else {
      setBg(getDefaultSettingsBg())
    }
  }, [selectedItem?.cover, setBg])

  useEffect(() => {
    return () => {
      setBg(getDefaultSettingsBg())
    }
  }, [setBg])

  const selectItem = useCallback((item: OstItem) => {
    setSelectedId(item.id)
  }, [])

  const setKeywordInput = useCallback((value: string) => {
    setKeywordInputState(value)
    setPage(1)
  }, [])

  const setPageSize = useCallback((newSize: number) => {
    setPageSizeState(newSize)
    setPage(1)
  }, [])

  const openCreateDialog = useCallback(() => {
    setEditingItem(null)
    setDialogOpen(true)
  }, [])

  const openEditDialog = useCallback((item: OstItem) => {
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
      gameId: number
      name: string
      cover: string
      resource?: string
      songs?: Array<{ name: string; url: string; duration?: string }>
    }) => {
      if (!Number.isInteger(data.gameId) || data.gameId <= 0) {
        toast.error('请选择游戏')
        return
      }
      if (!data.name.trim() || !data.cover.trim()) {
        toast.error('OST 名称和封面不能为空')
        return
      }

      const songCount = data.songs?.length ?? 0
      const progressToastId = toast.loading(
        songCount > 0 ? `正在保存 ${songCount} 首歌曲...` : '正在保存 OST...',
        { duration: 30000 },
      )

      setIsSubmitting(true)
      try {
        if (editingItem) {
          await updateOstManageItem(editingItem.id, {
            gameId: data.gameId,
            name: data.name.trim(),
            cover: data.cover.trim(),
            resource: data.resource,
          })
          toast.success('OST 已更新', { id: progressToastId })
        } else {
          await createOstManageItem({
            gameId: data.gameId,
            name: data.name.trim(),
            cover: data.cover.trim(),
            resource: data.resource,
            songs: data.songs,
          })
          toast.success('OST 已创建', {
            id: progressToastId,
            description: songCount > 0 ? `已保存 ${songCount} 首歌曲` : undefined,
            duration: 5000,
          })
        }

        setDialogOpen(false)
        setEditingItem(null)
        await queryClient.invalidateQueries({ queryKey: ['ost-manage'] })
      } catch (error) {
        const err = error as { response?: { data?: { error?: string } }; message?: string }
        toast.error(err.response?.data?.error || err.message || '保存 OST 失败', {
          id: progressToastId,
        })
      } finally {
        setIsSubmitting(false)
      }
    },
    [editingItem, queryClient],
  )

  const handleDelete = useCallback(async () => {
    if (!pendingDelete) return
    setIsSubmitting(true)
    try {
      await deleteOstManageItem(pendingDelete.id)
      toast.success('OST 已删除')
      setPendingDelete(null)
      await queryClient.invalidateQueries({ queryKey: ['ost-manage'] })
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } }; message?: string }
      toast.error(err.response?.data?.error || err.message || '删除 OST 失败')
    } finally {
      setIsSubmitting(false)
    }
  }, [pendingDelete, queryClient])

  return {
    keywordInput,
    setKeywordInput,
    page: currentPage,
    pageSize,
    total,
    totalPages,
    setPage,
    setPageSize,
    items,
    selectedItem,
    selectItem,
    isLoading,
    isRefetching,
    dialogOpen,
    editingItem,
    pendingDelete,
    setPendingDelete,
    isSubmitting,
    openCreateDialog,
    openEditDialog,
    handleDialogOpenChange,
    handleSubmit,
    handleDelete,
  }
}
