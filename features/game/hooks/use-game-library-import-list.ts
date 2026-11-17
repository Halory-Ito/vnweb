'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import type {
  GameLibraryImportItem,
  GameLibraryImportResult,
  GameLibraryImportRow,
} from '../lib/game-library-import'

type GameLibraryImportListOptions = {
  label: string
  searchItems: () => Promise<GameLibraryImportItem[]>
  validateSearch: () => string | null
  importItem: (item: GameLibraryImportItem) => Promise<GameLibraryImportResult>
}

export function useGameLibraryImportList({
  label,
  searchItems,
  validateSearch,
  importItem,
}: GameLibraryImportListOptions) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [items, setItems] = useState<GameLibraryImportRow[]>([])
  const searchMutation = useMutation({ mutationFn: searchItems })
  const importMutation = useMutation({ mutationFn: importItem })
  const isSearching = searchMutation.isPending
  const [isImporting, setIsImporting] = useState(false)
  const [showOnlyNotImported, setShowOnlyNotImported] = useState(false)
  const selectedCount = items.filter((item) => item.selected).length
  const importedCount = items.filter((item) => item.status === 'imported').length
  const skippedCount = items.filter((item) => item.status === 'skipped').length
  const failedCount = items.filter((item) => item.status === 'failed').length
  const visibleItems = showOnlyNotImported
    ? items.filter((item) => item.status !== 'imported' && item.status !== 'skipped')
    : items

  const handleSearch = async () => {
    if (isSearching || isImporting) return
    const validationError = validateSearch()
    if (validationError) {
      toast.error(validationError)
      return
    }
    try {
      const rows = await searchMutation.mutateAsync()
      setItems(
        rows.map((item) => ({
          ...item,
          selected: !item.alreadyImported,
          status: item.alreadyImported ? 'skipped' : 'idle',
          reason: item.alreadyImported ? '已存在于库中' : '',
        })),
      )
      toast.success(`已获取 ${rows.length} 项，请勾选需要导入的条目`)
    } catch (error) {
      toast.error(`${label}列表读取失败，请稍后重试`)
      console.error(`${label} import search failed:`, error)
    }
  }

  const setAllSelectable = (selected: boolean) => {
    setItems((prev) =>
      prev.map((item) =>
        item.status === 'imported' || item.status === 'skipped' ? item : { ...item, selected },
      ),
    )
  }

  const handleToggleSelect = (id: string, selected: boolean) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, selected } : item)))
  }

  const handleImport = async () => {
    if (isSearching || isImporting) return
    const targets = items.filter(
      (item) =>
        item.selected &&
        item.status !== 'imported' &&
        item.status !== 'skipped' &&
        item.status !== 'importing',
    )
    if (targets.length === 0) {
      toast.error('请先勾选需要导入的游戏')
      return
    }
    setIsImporting(true)
    const updateItem = (id: string, patch: Partial<GameLibraryImportRow>) => {
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
    }
    try {
      let cursor = 0
      const workers = Array.from({ length: Math.min(4, targets.length) }, async () => {
        while (cursor < targets.length) {
          const target = targets[cursor++]
          updateItem(target.id, { status: 'importing', reason: '' })
          try {
            const result = await importMutation.mutateAsync(target)
            updateItem(target.id, {
              selected: false,
              status: result.status,
              reason: result.reason ?? '',
            })
          } catch (error) {
            updateItem(target.id, {
              status: 'failed',
              reason: error instanceof Error ? error.message : '导入失败',
            })
          }
        }
      })
      await Promise.all(workers)
      await Promise.all(
        ['game', 'game-cards', 'game-sidebar'].map((key) =>
          queryClient.invalidateQueries({ queryKey: [key] }),
        ),
      )
      router.refresh()
      toast.success('已完成所选游戏导入')
    } catch (error) {
      toast.error(`${label}导入失败，请稍后重试`)
      console.error(`${label} import failed:`, error)
    } finally {
      setIsImporting(false)
    }
  }

  return {
    items,
    visibleItems,
    selectedCount,
    importedCount,
    skippedCount,
    failedCount,
    isSearching,
    isImporting,
    showOnlyNotImported,
    setShowOnlyNotImported,
    handleSearch,
    handleImport,
    setAllSelectable,
    handleToggleSelect,
  }
}
