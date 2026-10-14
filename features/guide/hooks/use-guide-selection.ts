'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { deleteGuidesApi } from '@/features/guide/guide-api'

// 攻略列表的多选与批量删除逻辑
export function useGuideSelection() {
  const queryClient = useQueryClient()
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [isDeleting, setIsDeleting] = useState(false)

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }, [])

  const clearSelection = useCallback(() => setSelectedIds([]), [])

  const selectAll = useCallback((ids: number[]) => setSelectedIds(ids), [])

  // 删除选中的攻略，成功返回 true
  const deleteSelected = useCallback(async (): Promise<boolean> => {
    if (selectedIds.length === 0) {
      return false
    }

    setIsDeleting(true)
    try {
      const { deleted } = await deleteGuidesApi(selectedIds)

      setSelectedIds([])
      await queryClient.invalidateQueries({ queryKey: ['guide-list'] })
      toast.success(`已删除 ${deleted} 篇攻略`)
      return true
    } catch (error) {
      console.error('删除攻略失败:', error)
      toast.error('删除攻略失败，请稍后重试')
      return false
    } finally {
      setIsDeleting(false)
    }
  }, [queryClient, selectedIds])

  return {
    selectedIds,
    isDeleting,
    // 已有选中项时，点击卡片本身即视为切换选择
    isSelectionMode: selectedIds.length > 0,
    toggleSelect,
    clearSelection,
    selectAll,
    deleteSelected,
  }
}
