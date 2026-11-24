'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSetAtom } from 'jotai'
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { toast } from 'sonner'

import {
  createOstManageAlbums,
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

import type { OstFormSubmission } from './use-ost-form'
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

const WIDE_RECORDS_PER_TIER = 10
const NARROW_RECORDS_PER_TIER = 5
const NARROW_SCREEN_QUERY = '(width < 768px)'

function getDefaultRecordsPerTierSnapshot(): number {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return WIDE_RECORDS_PER_TIER
  }
  return window.matchMedia(NARROW_SCREEN_QUERY).matches
    ? NARROW_RECORDS_PER_TIER
    : WIDE_RECORDS_PER_TIER
}

function getServerDefaultRecordsPerTierSnapshot(): number {
  return WIDE_RECORDS_PER_TIER
}

function subscribeDefaultRecordsPerTier(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => {}
  }

  const mql = window.matchMedia(NARROW_SCREEN_QUERY)
  mql.addEventListener('change', onStoreChange)
  return () => mql.removeEventListener('change', onStoreChange)
}

export function useOstManage() {
  const queryClient = useQueryClient()
  const setBg = useSetAtom(bgAtom)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<OstItem | null>(null)
  const [editingItem, setEditingItem] = useState<OstItem | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null
    const saved = window.sessionStorage.getItem('ost-last-selected-id')
    if (!saved) return null
    window.sessionStorage.removeItem('ost-last-selected-id')
    const parsed = Number(saved)
    return Number.isFinite(parsed) ? parsed : null
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [keywordInput, setKeywordInputState] = useState('')
  const [page, setPage] = useState(1)
  const [pageDirection, setPageDirection] = useState(0)
  const defaultRecordsPerTier = useSyncExternalStore(
    subscribeDefaultRecordsPerTier,
    getDefaultRecordsPerTierSnapshot,
    getServerDefaultRecordsPerTierSnapshot,
  )
  const [customRecordsPerTier, setCustomRecordsPerTier] = useState<number | null>(null)
  const recordsPerTier = customRecordsPerTier ?? defaultRecordsPerTier
  const [tierCount, setTierCountState] = useState(2)
  const pageSize = recordsPerTier * tierCount

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
    () => items.find((item) => item.id === selectedId) ?? null,
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
    setPageDirection(0)
    setPage(1)
  }, [])

  const setRecordsPerTier = useCallback((count: number) => {
    setCustomRecordsPerTier(count)
    setPageDirection(0)
    setPage(1)
  }, [])

  const setTierCount = useCallback((count: number) => {
    setTierCountState(count)
    setPageDirection(0)
    setPage(1)
  }, [])

  const changePage = (nextPage: number) => {
    setPageDirection(Math.sign(nextPage - currentPage))
    setPage(nextPage)
  }

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
    async (data: OstFormSubmission) => {
      if (!Number.isInteger(data.gameId) || data.gameId <= 0) {
        toast.error('请选择游戏')
        return
      }
      const progressToastId = toast.loading('正在保存 OST...', { duration: 30000 })

      setIsSubmitting(true)
      try {
        if ('albums' in data) {
          await createOstManageAlbums(data)
          toast.success(`已添加 ${data.albums.length} 张 OST 专辑`, { id: progressToastId })
        } else if (editingItem) {
          await updateOstManageItem(editingItem.id, data)
          toast.success('OST 已更新', { id: progressToastId })
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
    pageDirection: page === currentPage ? pageDirection : 0,
    pageSize,
    recordsPerTier,
    tierCount,
    total,
    totalPages,
    setPage: changePage,
    setRecordsPerTier,
    setTierCount,
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
