'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import {
  getAvailableOptionalColumns,
  getPlatformImportSource,
} from '../data/platform-import-sources'
import { selectDirectory } from '../lib/scan-utils'
import {
  detectPlatformImportPathsApi,
  discardPlatformImportSessionApi,
  executePlatformImportApi,
  previewPlatformImportFileApi,
  previewPlatformImportPathApi,
} from '@/api'

import type {
  ExternalImportPlatform,
  PlatformImportConflictStrategy,
  PlatformImportExecuteItemResult,
  PlatformImportExecuteResult,
  PlatformImportOptionalColumn,
  PlatformImportOptions,
  PlatformImportPreviewItem,
  PlatformImportSessionPreview,
} from '@/types/platform-import'

const DEFAULT_OPTIONS: PlatformImportOptions = {
  conflictStrategy: 'keep_existing',
  importPlayRecords: true,
  importImages: true,
  importCollections: true,
  importMemories: true,
  importCharacters: true,
}

function getErrorMessage(error: unknown, fallback: string): string {
  const axiosError = error as { response?: { data?: { error?: string } }; message?: string }
  return axiosError?.response?.data?.error || axiosError?.message || fallback
}

export function usePlatformImport({
  initialPlatform = 'playnite',
  lockPlatform = false,
}: {
  initialPlatform?: ExternalImportPlatform
  lockPlatform?: boolean
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [open, setOpen] = useState(false)
  const [platform, setPlatform] = useState<ExternalImportPlatform>(initialPlatform)
  const [inputMode, setInputMode] = useState<'file' | 'directory'>('file')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [localPath, setLocalPath] = useState('')
  const [preview, setPreview] = useState<PlatformImportSessionPreview | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [options, setOptions] = useState<PlatformImportOptions>(DEFAULT_OPTIONS)
  const [itemStrategies, setItemStrategies] = useState<
    Record<string, PlatformImportConflictStrategy>
  >({})
  const [keyword, setKeyword] = useState('')
  const [onlyNew, setOnlyNew] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState<Set<PlatformImportOptionalColumn>>(
    () => new Set(),
  )
  const [executeResult, setExecuteResult] = useState<PlatformImportExecuteResult | null>(null)

  const sourceMeta = useMemo(() => getPlatformImportSource(platform), [platform])
  const availableOptionalColumns = useMemo(
    () => getAvailableOptionalColumns(sourceMeta),
    [sourceMeta],
  )
  const activeOptionalColumns = useMemo(
    () => availableOptionalColumns.filter((col) => visibleColumns.has(col.id)),
    [availableOptionalColumns, visibleColumns],
  )

  const { data: detectedPaths = [] } = useQuery({
    queryKey: ['platform-import-detect'],
    queryFn: async () => {
      const res = await detectPlatformImportPathsApi()
      return res.data.data.items
    },
    enabled: open,
    staleTime: 60_000,
  })

  const detectedPath = useMemo(
    () => detectedPaths.find((item) => item.platform === platform && item.exists) ?? null,
    [detectedPaths, platform],
  )

  const getEffectiveStrategy = useCallback(
    (sourceId: string): PlatformImportConflictStrategy =>
      itemStrategies[sourceId] ?? options.conflictStrategy,
    [itemStrategies, options.conflictStrategy],
  )

  const isItemSelectable = useCallback(
    (item: PlatformImportPreviewItem) =>
      !item.alreadyExists || getEffectiveStrategy(item.sourceId) !== 'keep_existing',
    [getEffectiveStrategy],
  )

  const previewMutation = useMutation({
    mutationFn: async () => {
      if (inputMode === 'file') {
        if (!selectedFile) throw new Error('请先选择需要导入的备份或导出文件')
        const res = await previewPlatformImportFileApi(platform, selectedFile)
        return res.data.data
      }
      const trimmed = localPath.trim()
      if (!trimmed) throw new Error('请填写或选择本地数据目录')
      const res = await previewPlatformImportPathApi(platform, trimmed)
      return res.data.data
    },
    onSuccess: (data) => {
      setPreview(data)
      setExecuteResult(null)
      setItemStrategies({})
      setKeyword('')
      setOnlyNew(false)
      const initialSelected = data.items
        .filter((item) => !item.alreadyExists || options.conflictStrategy !== 'keep_existing')
        .map((item) => item.sourceId)
      setSelectedIds(new Set(initialSelected))
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, '解析数据源失败'))
    },
  })

  const executeMutation = useMutation({
    mutationFn: async () => {
      if (!preview) throw new Error('请先解析数据源')
      const targetIds = Array.from(selectedIds).filter((id) => {
        const item = preview.items.find((row) => row.sourceId === id)
        return item ? isItemSelectable(item) : false
      })
      if (targetIds.length === 0) throw new Error('请至少勾选一款可导入的游戏')

      const targetStrategies: Record<string, PlatformImportConflictStrategy> = {}
      for (const id of targetIds) {
        if (itemStrategies[id]) {
          targetStrategies[id] = itemStrategies[id]
        }
      }

      const res = await executePlatformImportApi({
        sessionId: preview.sessionId,
        selectedSourceIds: targetIds,
        options,
        itemStrategies: targetStrategies,
      })
      return res.data.data
    },
    onSuccess: async (result) => {
      setExecuteResult(result)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['game'] }),
        queryClient.invalidateQueries({ queryKey: ['game-cards'] }),
        queryClient.invalidateQueries({ queryKey: ['game-sidebar'] }),
        queryClient.invalidateQueries({ queryKey: ['collections'] }),
        queryClient.invalidateQueries({ queryKey: ['collection'] }),
      ])
      router.refresh()
      toast.success(
        `导入完成：新增 ${result.importedCount}，合并 ${result.mergedCount}，覆盖 ${result.replacedCount}，跳过 ${result.skippedCount}`,
      )
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, '导入执行失败'))
    },
  })

  const isBusy = previewMutation.isPending || executeMutation.isPending

  const clearSession = () => {
    if (preview?.sessionId) {
      void discardPlatformImportSessionApi(preview.sessionId).catch(() => undefined)
    }
    setPreview(null)
    setExecuteResult(null)
    setItemStrategies({})
    setSelectedIds(new Set())
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isBusy) return
    if (!nextOpen) {
      clearSession()
      setSelectedFile(null)
      setLocalPath('')
      setKeyword('')
      setOnlyNew(false)
      setVisibleColumns(new Set())
      setPlatform(initialPlatform)
      setOptions(DEFAULT_OPTIONS)
    }
    setOpen(nextOpen)
  }

  const handlePlatformChange = (nextPlatform: ExternalImportPlatform) => {
    if (lockPlatform || isBusy || nextPlatform === platform) return
    clearSession()
    setSelectedFile(null)
    setLocalPath('')
    setVisibleColumns(new Set())
    setPlatform(nextPlatform)
  }

  const handleSelectDirectory = async () => {
    try {
      const directory = await selectDirectory()
      if (directory) {
        setInputMode('directory')
        setLocalPath(directory)
      }
    } catch {
      toast.error('选择目录失败')
    }
  }

  const handleApplyDetectedPath = () => {
    if (!detectedPath) return
    setInputMode('directory')
    setLocalPath(detectedPath.path)
  }

  const handleFileChange = (file: File | null) => {
    setSelectedFile(file)
  }

  const handleOptionChange = <K extends keyof PlatformImportOptions>(
    key: K,
    value: PlatformImportOptions[K],
  ) => {
    setOptions((prev) => ({ ...prev, [key]: value }))
    if (key === 'conflictStrategy' && preview) {
      const nextStrategy = value as PlatformImportConflictStrategy
      setSelectedIds((prev) => {
        const next = new Set(prev)
        for (const item of preview.items) {
          if (!item.alreadyExists || itemStrategies[item.sourceId]) continue
          if (nextStrategy === 'keep_existing') next.delete(item.sourceId)
          else next.add(item.sourceId)
        }
        return next
      })
    }
  }

  const handleItemStrategyChange = useCallback(
    (sourceId: string, strategy: PlatformImportConflictStrategy) => {
      setItemStrategies((prev) => {
        const next = { ...prev }
        if (strategy === options.conflictStrategy) {
          delete next[sourceId]
        } else {
          next[sourceId] = strategy
        }
        return next
      })
      setSelectedIds((prev) => {
        const next = new Set(prev)
        if (strategy === 'keep_existing') next.delete(sourceId)
        else next.add(sourceId)
        return next
      })
    },
    [options.conflictStrategy],
  )

  const visibleItems = useMemo(() => {
    if (!preview) return []
    const q = keyword.trim().toLowerCase()
    return preview.items.filter((item) => {
      if (onlyNew && item.alreadyExists) return false
      if (!q) return true
      return (
        item.name.toLowerCase().includes(q) ||
        item.nameCn.toLowerCase().includes(q) ||
        item.developer.toLowerCase().includes(q)
      )
    })
  }, [preview, keyword, onlyNew])

  const resultMap = useMemo(() => {
    const map = new Map<string, PlatformImportExecuteItemResult>()
    for (const row of executeResult?.items ?? []) {
      map.set(row.sourceId, row)
    }
    return map
  }, [executeResult])

  const selectableSelectedCount = useMemo(() => {
    if (!preview) return 0
    return preview.items.filter((item) => selectedIds.has(item.sourceId) && isItemSelectable(item))
      .length
  }, [preview, selectedIds, isItemSelectable])

  const headerSelectState = useMemo(() => {
    let selectableCount = 0
    let selectedCount = 0
    for (const item of visibleItems) {
      if (!isItemSelectable(item)) continue
      selectableCount += 1
      if (selectedIds.has(item.sourceId)) selectedCount += 1
    }
    const checked: boolean | 'indeterminate' =
      selectableCount > 0 && selectedCount === selectableCount
        ? true
        : selectedCount > 0
          ? 'indeterminate'
          : false
    return { selectableCount, checked }
  }, [visibleItems, isItemSelectable, selectedIds])

  const toggleItem = useCallback((sourceId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(sourceId)
      else next.delete(sourceId)
      return next
    })
  }, [])

  const setAllVisibleSelected = useCallback(
    (checked: boolean) => {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        for (const item of visibleItems) {
          if (!isItemSelectable(item)) continue
          if (checked) next.add(item.sourceId)
          else next.delete(item.sourceId)
        }
        return next
      })
    },
    [visibleItems, isItemSelectable],
  )

  const toggleColumn = useCallback((column: PlatformImportOptionalColumn, visible?: boolean) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev)
      const shouldShow = visible ?? !next.has(column)
      if (shouldShow) next.add(column)
      else next.delete(column)
      return next
    })
  }, [])

  const resetVisibleColumns = useCallback(() => {
    setVisibleColumns(new Set())
  }, [])

  return {
    open,
    handleOpenChange,
    platform,
    lockPlatform,
    sourceMeta,
    handlePlatformChange,
    inputMode,
    setInputMode,
    fileInputRef,
    selectedFile,
    handleFileChange,
    localPath,
    setLocalPath,
    detectedPath,
    handleSelectDirectory,
    handleApplyDetectedPath,
    preview,
    visibleItems,
    selectedIds,
    selectableSelectedCount,
    headerSelectState,
    availableOptionalColumns,
    activeOptionalColumns,
    visibleColumns,
    toggleColumn,
    resetVisibleColumns,
    getEffectiveStrategy,
    handleItemStrategyChange,
    isItemSelectable,
    toggleItem,
    setAllVisibleSelected,
    options,
    handleOptionChange,
    keyword,
    setKeyword,
    onlyNew,
    setOnlyNew,
    executeResult,
    resultMap,
    isParsing: previewMutation.isPending,
    isImporting: executeMutation.isPending,
    isBusy,
    handleParse: () => previewMutation.mutate(),
    handleExecute: () => executeMutation.mutate(),
    handleResetToSource: clearSession,
  }
}
