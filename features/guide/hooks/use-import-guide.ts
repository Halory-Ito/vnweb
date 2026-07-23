'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'

import {
  getGuideApi,
  importGuideApi,
  searchGuidesApi,
  validateGuideJson,
  type GuideSearchResult,
} from '@/features/guide/guide-api'
import { getGameCardList } from '@/lib/game/game-utils'

export type ImportMode = 'search' | 'json'

export function useImportGuide() {
  const queryClient = useQueryClient()

  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<ImportMode>('search')
  const [selectedGameId, setSelectedGameId] = useState<string>('')

  // 搜索模式
  const [keyword, setKeyword] = useState('')
  const [searchResults, setSearchResults] = useState<GuideSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedGuide, setSelectedGuide] = useState<GuideSearchResult | null>(null)

  // JSON 模式
  const [jsonText, setJsonText] = useState('')
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [jsonGuide, setJsonGuide] = useState<GuideSearchResult | null>(null)

  const [isImporting, setIsImporting] = useState(false)
  const [isOverwriteAlertOpen, setIsOverwriteAlertOpen] = useState(false)
  const [pendingImport, setPendingImport] = useState<{
    gameId: number
    guide: GuideSearchResult
    gameCover: string
  } | null>(null)

  const { data: gameCards = [] } = useQuery({
    queryKey: ['game-cards'],
    queryFn: () => getGameCardList(),
    enabled: open,
  })

  const selectedGameTitle = useMemo(
    () => gameCards.find((game) => game.id === selectedGameId)?.title || '',
    [gameCards, selectedGameId],
  )

  const resetForm = useCallback(() => {
    setKeyword('')
    setSearchResults([])
    setHasSearched(false)
    setSelectedGuide(null)

    setJsonText('')
    setJsonError(null)
    setJsonGuide(null)

    setSelectedGameId('')
    setPendingImport(null)
    setIsOverwriteAlertOpen(false)
  }, [])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen)
      if (!nextOpen) {
        resetForm()
      }
    },
    [resetForm],
  )

  const handleModeChange = useCallback((nextMode: ImportMode) => {
    setMode(nextMode)
  }, [])

  const handleSearch = useCallback(async () => {
    if (!keyword.trim()) return

    setIsSearching(true)
    setHasSearched(false)
    setSelectedGuide(null)

    try {
      const data = await searchGuidesApi(keyword)
      setSearchResults(data.list || [])
      setHasSearched(true)
    } catch (error) {
      console.error('搜索攻略失败:', error)
      toast.error('搜索攻略失败，请稍后重试')
    } finally {
      setIsSearching(false)
    }
  }, [keyword])

  const handleJsonTextChange = useCallback((text: string) => {
    setJsonText(text)

    if (!text.trim()) {
      setJsonError(null)
      setJsonGuide(null)
      return
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      setJsonError('JSON 格式错误，请检查语法')
      setJsonGuide(null)
      return
    }

    try {
      const guide = validateGuideJson(parsed)
      setJsonError(null)
      setJsonGuide(guide)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'JSON 数据结构不符合攻略格式'
      setJsonError(message)
      setJsonGuide(null)
    }
  }, [])

  const canImport = useMemo(() => {
    if (!selectedGameId) return false
    if (mode === 'search') return !!selectedGuide
    if (mode === 'json') return !!jsonGuide
    return false
  }, [mode, selectedGameId, selectedGuide, jsonGuide])

  const executeImport = useCallback(
    async (params: { gameId: number; guide: GuideSearchResult; overwrite: boolean }) => {
      setIsImporting(true)
      try {
        await importGuideApi(params)

        toast.success(params.overwrite ? '攻略覆盖成功' : '攻略导入成功')
        queryClient.invalidateQueries({ queryKey: ['guide-list'] })
        queryClient.invalidateQueries({ queryKey: ['guide', params.gameId] })
        setOpen(false)
        resetForm()
      } catch (error) {
        console.error('导入攻略失败:', error)
        toast.error('导入攻略失败，请稍后重试')
      } finally {
        setIsImporting(false)
      }
    },
    [queryClient, resetForm],
  )

  const handleImport = useCallback(async () => {
    if (!canImport) {
      toast.error('请选择攻略和游戏')
      return
    }

    const guide = mode === 'search' ? selectedGuide! : jsonGuide!
    const selectedGame = gameCards.find((game) => game.id === selectedGameId)
    const gameCover = selectedGame?.cover || ''
    const gameId = Number(selectedGameId)

    try {
      const existingGuide = await getGuideApi(gameId)
      if (existingGuide) {
        setPendingImport({ gameId, guide: { ...guide, cover: gameCover }, gameCover })
        setIsOverwriteAlertOpen(true)
        return
      }

      await executeImport({ gameId, guide: { ...guide, cover: gameCover }, overwrite: false })
    } catch (error) {
      console.error('检查已有攻略失败:', error)
      toast.error('检查游戏攻略状态失败，请稍后重试')
    }
  }, [canImport, gameCards, jsonGuide, mode, selectedGameId, selectedGuide, executeImport])

  const confirmOverwrite = useCallback(async () => {
    if (!pendingImport) return

    setIsOverwriteAlertOpen(false)
    await executeImport({
      gameId: pendingImport.gameId,
      guide: pendingImport.guide,
      overwrite: true,
    })
  }, [executeImport, pendingImport])

  return {
    open,
    setOpen: handleOpenChange,
    mode,
    setMode: handleModeChange,
    selectedGameId,
    setSelectedGameId,
    gameCards,
    keyword,
    setKeyword,
    searchResults,
    isSearching,
    hasSearched,
    selectedGuide,
    setSelectedGuide,
    handleSearch,
    jsonText,
    jsonError,
    jsonGuide,
    setJsonText: handleJsonTextChange,
    isImporting,
    canImport,
    handleImport,
    isOverwriteAlertOpen,
    setIsOverwriteAlertOpen,
    confirmOverwrite,
    selectedGameTitle,
  }
}
