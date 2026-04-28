'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { OstDeleteDialog } from './_ui/ost-delete-dialog'
import { OstFormDialog } from './_ui/ost-form-dialog'
import { OstManageContent } from './_ui/ost-manage-content'
import { OstPageHeader } from './_ui/ost-page-header'
import { OstSearchToolbar } from './_ui/ost-search-toolbar'
import {
  createOstManageItem,
  deleteOstManageItem,
  getGameCardList,
  getOstManageList,
  updateOstManageItem,
  type OstManageItem,
} from '@/lib/game-utils'

import type { OstItem } from './_ui/types'

// 转换 OstManageItem 为 OstItem
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

export default function OSTPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<OstItem | null>(null)
  const [editingItem, setEditingItem] = useState<OstItem | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 搜索/筛选状态
  const [keywordInput, setKeywordInput] = useState('')
  const [gameFilter, setGameFilter] = useState('all')

  // 获取游戏列表用于筛选
  const { data: gameCards = [] } = useQuery({
    queryKey: ['game-cards'],
    queryFn: () => getGameCardList(),
  })

  const {
    data: ostData,
    isLoading,
    isRefetching,
  } = useQuery({
    queryKey: ['ost-manage'],
    queryFn: () => getOstManageList(),
  })

  // 静默同步封面到本地（仅首次加载时）
  useEffect(() => {
    const syncCovers = async () => {
      try {
        await fetch('/api/ost', { method: 'PATCH' })
      } catch {
        // 静默失败，不给用户提示
      }
    }
    void syncCovers()
  }, [])

  // 筛选后的 OST 数据
  const filteredItems = (ostData?.items ?? []).filter((item) => {
    // 关键词筛选
    if (keywordInput) {
      const kw = keywordInput.toLowerCase()
      const nameMatch = item.name.toLowerCase().includes(kw)
      const gameNameMatch =
        item.gameName?.toLowerCase().includes(kw) ||
        item.gameNameCn?.toLowerCase().includes(kw)
      if (!nameMatch && !gameNameMatch) return false
    }

    // 游戏筛选
    if (gameFilter !== 'all') {
      if (String(item.gameId) !== gameFilter) return false
    }

    return true
  })

  const items = transformItems(filteredItems)

  const openCreateDialog = () => {
    setEditingItem(null)
    setDialogOpen(true)
  }

  const openEditDialog = (item: OstItem) => {
    setEditingItem(item)
    setDialogOpen(true)
  }

  const handleSearch = () => {
    // 筛选逻辑在 useMemo 中处理，这里不需要额外操作
  }

  const handleReset = () => {
    setKeywordInput('')
    setGameFilter('all')
  }

  const handleSubmit = async (data: {
    gameId: number
    name: string
    cover: string
    resource?: string
    songs?: Array<{
      name: string
      url: string
      duration?: string
    }>
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
        toast.success('OST 已更新')
      } else {
        const result = await createOstManageItem({
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
        // 返回本地封面路径（如果有）
        if (result?.data?.item?.cover) {
          // 更新表单状态以反映新的本地封面路径
        }
      }

      setDialogOpen(false)
      setEditingItem(null)
      await queryClient.invalidateQueries({ queryKey: ['ost-manage'] })
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: string } }
        message?: string
      }
      toast.error(err.response?.data?.error || err.message || '保存 OST 失败', {
        id: progressToastId,
      })
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
      await deleteOstManageItem(pendingDelete.id)
      toast.success('OST 已删除')
      setPendingDelete(null)
      await queryClient.invalidateQueries({ queryKey: ['ost-manage'] })
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: string } }
        message?: string
      }
      toast.error(err.response?.data?.error || err.message || '删除 OST 失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 游戏选项
  const gameOptions = gameCards.map((game) => ({
    id: String(game.id),
    label: game.title,
  }))

  return (
    <div className="max-h-[calc(100vh-70px)] w-full space-y-4 overflow-x-hidden overflow-y-scroll p-4">
      <OstPageHeader onCreate={openCreateDialog} />

      <OstSearchToolbar
        keywordInput={keywordInput}
        gameFilter={gameFilter}
        gameOptions={gameOptions}
        onKeywordInputChange={setKeywordInput}
        onGameFilterChange={setGameFilter}
        onSearch={handleSearch}
        onReset={handleReset}
      />

      <OstManageContent
        items={items}
        isLoading={isLoading}
        isRefetching={isRefetching}
        onEdit={openEditDialog}
        onDelete={setPendingDelete}
      />

      <OstFormDialog
        open={dialogOpen}
        editingItem={editingItem}
        isSubmitting={isSubmitting}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            setEditingItem(null)
          }
        }}
        onSubmit={handleSubmit}
      />

      <OstDeleteDialog
        item={pendingDelete}
        isSubmitting={isSubmitting}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDelete(null)
          }
        }}
        onConfirm={() => void handleDelete()}
      />
    </div>
  )
}
