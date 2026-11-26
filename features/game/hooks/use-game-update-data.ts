import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { updateGameInfoById } from '@/api'
import { getGameInfoByIdApi, searchGameByNameApi } from '@/features/game/import-api'
import { useEnabledPlatforms } from '@/hooks/use-enabled-platforms'

import type { GameInfo } from '@/types/game'

const UPDATE_DATA_PROVIDERS = [
  { value: 'bangumi', label: 'Bangumi' },
  { value: 'steamgriddb', label: 'SteamGrid DB' },
] as const

type GameSearchItem = {
  id: string
  name: string
  developer: string
  date: string
}

export const fieldConfigs = [
  { key: 'date', label: '发布日期' },
  { key: 'summary', label: '简介' },
  { key: 'name', label: '游戏名称' },
  { key: 'nameCn', label: '中文名称' },
  { key: 'tags', label: '标签' },
  { key: 'ailases', label: '别名' },
  { key: 'platforms', label: '平台' },
  { key: 'gameType', label: '游戏类型' },
  { key: 'gameEngine', label: '游戏引擎' },
  { key: 'music', label: '音乐' },
  { key: 'script', label: '剧本' },
  { key: 'graphic', label: '美术' },
  { key: 'originalPainter', label: '原画' },
  { key: 'animationProduction', label: '动画制作' },
  { key: 'developer', label: '开发商' },
  { key: 'publisher', label: '发行商' },
  { key: 'programmer', label: '程序' },
] as const satisfies ReadonlyArray<{ key: keyof GameInfo; label: string }>

type GameInfoFieldKey = (typeof fieldConfigs)[number]['key']

export function useGameUpdateData({
  gameId,
  initialKeyword,
  open,
  onOpenChange,
}: {
  gameId: number
  initialKeyword?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const pageSize = 5
  const router = useRouter()
  const queryClient = useQueryClient()
  const { isPlatformEnabled } = useEnabledPlatforms()
  const enabledProviders = useMemo(
    () => UPDATE_DATA_PROVIDERS.filter((item) => isPlatformEnabled(item.value, 'game-metadata')),
    [isPlatformEnabled],
  )
  const [provider, setProvider] = useState('bangumi')
  const activeProvider = enabledProviders.some((item) => item.value === provider)
    ? provider
    : (enabledProviders[0]?.value ?? '')
  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState<GameSearchItem[]>([])
  const [searchPage, setSearchPage] = useState(1)
  const [searchTotal, setSearchTotal] = useState(0)
  const [selectedId, setSelectedId] = useState('')
  const [fetchedInfo, setFetchedInfo] = useState<GameInfo | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isFetchingInfo, setIsFetchingInfo] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [selectedFields, setSelectedFields] = useState<Partial<Record<GameInfoFieldKey, boolean>>>(
    {},
  )

  useEffect(() => {
    if (!open) {
      return
    }

    const nextKeyword = (initialKeyword || '').trim()
    if (nextKeyword) {
      setKeyword(nextKeyword)
    }
  }, [open, initialKeyword])

  const selectedCount = useMemo(
    () => Object.values(selectedFields).filter(Boolean).length,
    [selectedFields],
  )

  const loadSearchResults = async (page: number) => {
    if (!activeProvider) {
      toast.error('请先在「设置 → 平台」开启至少一个数据源')
      return
    }
    const trimmed = keyword.trim()
    if (!trimmed) {
      toast.error('请输入关键词')
      return
    }

    setIsSearching(true)
    try {
      const nextOffset = (page - 1) * pageSize
      const response = await searchGameByNameApi(trimmed, activeProvider, nextOffset, pageSize)
      setResults(response.items)
      setSearchTotal(response.total)
      setSearchPage(page)
      if (response.items.length === 0) {
        toast.error('未搜索到结果')
      }
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearch = async () => {
    await loadSearchResults(1)
  }

  const handleFetchInfoById = async (id: string) => {
    if (!activeProvider) {
      toast.error('请先在「设置 → 平台」开启至少一个数据源')
      return
    }
    if (!id) {
      toast.error('请先选择或输入 ID')
      return
    }

    setIsFetchingInfo(true)
    try {
      const info = await getGameInfoByIdApi(id, activeProvider)
      if (!info) {
        toast.error('未获取到资料')
        return
      }

      setSelectedId(id)
      setFetchedInfo(info)
      selectAllFields()
    } finally {
      setIsFetchingInfo(false)
    }
  }

  const toggleField = (key: GameInfoFieldKey, checked: boolean) => {
    setSelectedFields((prev) => ({
      ...prev,
      [key]: checked,
    }))
  }

  const selectAllFields = () => {
    setSelectedFields(Object.fromEntries(fieldConfigs.map(({ key }) => [key, true])))
  }

  const invertFields = () => {
    setSelectedFields((previous) =>
      Object.fromEntries(fieldConfigs.map(({ key }) => [key, !previous[key]])),
    )
  }

  const handleApply = async () => {
    if (!fetchedInfo) {
      toast.error('请先获取资料')
      return
    }

    const payload: Record<string, unknown> = {}
    for (const field of fieldConfigs) {
      if (!selectedFields[field.key]) {
        continue
      }
      payload[field.key] = fetchedInfo[field.key]
    }

    if (Object.keys(payload).length === 0) {
      toast.error('请至少选择一个属性')
      return
    }

    setIsUpdating(true)
    try {
      await updateGameInfoById(gameId, payload as never)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['game'] }),
        queryClient.invalidateQueries({ queryKey: ['game-cards'] }),
        queryClient.invalidateQueries({ queryKey: ['game-sidebar'] }),
      ])
      router.refresh()
      toast.success('资料已更新')
      onOpenChange(false)
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: string } }
        message?: string
      }
      toast.error(err.response?.data?.error || err.message || '更新失败')
    } finally {
      setIsUpdating(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(searchTotal / pageSize))

  return {
    enabledProviders,
    activeProvider,
    setProvider,
    keyword,
    setKeyword,
    results,
    searchPage,
    selectedId,
    isSearching,
    isFetchingInfo,
    isUpdating,
    fetchedInfo,
    selectedFields,
    selectedCount,
    totalPages,
    loadSearchResults,
    handleSearch,
    handleFetchInfoById,
    toggleField,
    selectAllFields,
    invertFields,
    handleApply,
  }
}
