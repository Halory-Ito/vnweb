import { useQuery } from '@tanstack/react-query'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { searchGameImages } from '@/api'
import { useEnabledPlatforms } from '@/hooks/use-enabled-platforms'
import {
  DEFAULT_GAME_IMAGE_SOURCE,
  GAME_IMAGE_SOURCES,
  GAME_IMAGE_TYPE_LABELS,
  type GameImageSource,
  type GameImageType,
} from '@/lib/game-image-sources'
import { getPlatformSettingsApi } from '@/lib/settings/platform-settings'
import { GAME_IMAGE_TYPE_TO_FEATURE_CATEGORY } from '@/lib/settings/platform-visibility'

import type { GameSearchImageItem } from '@/types'

/** 封装游戏图片多源检索与候选选中状态。 */
export function useGameImageSearch(imageType: GameImageType) {
  const { isPlatformEnabled } = useEnabledPlatforms()
  const { data: platformSettings } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: getPlatformSettingsApi,
  })
  const getAvailableSources = useCallback(
    (targetType: GameImageType) => {
      const category = GAME_IMAGE_TYPE_TO_FEATURE_CATEGORY[targetType]
      return GAME_IMAGE_SOURCES.filter(
        (item) => isPlatformEnabled(item.id, category) && item.supportedTypes.includes(targetType),
      )
    },
    [isPlatformEnabled],
  )
  const availableSources = useMemo(
    () => getAvailableSources(imageType),
    [getAvailableSources, imageType],
  )
  const [source, setSource] = useState<GameImageSource>(DEFAULT_GAME_IMAGE_SOURCE)
  const activeSource: GameImageSource | '' = availableSources.some((item) => item.id === source)
    ? source
    : (availableSources[0]?.id ?? '')
  const [keyword, setKeyword] = useState('')
  const [includeNsfw, setIncludeNsfw] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [matchedGameName, setMatchedGameName] = useState('')
  const [images, setImages] = useState<GameSearchImageItem[]>([])
  const [selectedUrl, setSelectedUrl] = useState('')

  const resolveDefaultNsfw = useCallback(
    (targetSource: GameImageSource | '') => {
      if (targetSource === 'yandere') return Boolean(platformSettings?.yandere?.allowNsfw)
      if (targetSource === 'konachan') return Boolean(platformSettings?.konachan?.allowNsfw)
      if (targetSource === 'danbooru') return Boolean(platformSettings?.danbooru?.allowNsfw)
      if (targetSource === 'gelbooru') return Boolean(platformSettings?.gelbooru?.allowNsfw)
      if (targetSource === 'wallhaven') return Boolean(platformSettings?.wallhaven?.allowNsfw)
      return false
    },
    [platformSettings],
  )

  const prepareSearch = useCallback(
    (initialKeyword: string, targetType: GameImageType) => {
      const targetSources = getAvailableSources(targetType)
      const nextSource = targetSources.some((item) => item.id === source)
        ? source
        : (targetSources[0]?.id ?? '')
      if (nextSource) setSource(nextSource)
      setKeyword(initialKeyword)
      setIncludeNsfw(resolveDefaultNsfw(nextSource))
      setMatchedGameName('')
      setImages([])
      setSelectedUrl('')
    },
    [getAvailableSources, resolveDefaultNsfw, source],
  )

  const handleSourceChange = useCallback(
    (nextSource: GameImageSource) => {
      setSource(nextSource)
      setIncludeNsfw(resolveDefaultNsfw(nextSource))
      setMatchedGameName('')
      setImages([])
      setSelectedUrl('')
    },
    [resolveDefaultNsfw],
  )

  const handleSearch = useCallback(
    async (targetType: GameImageType) => {
      if (!activeSource) {
        toast.error(`请先在「设置 → 平台」开启支持${GAME_IMAGE_TYPE_LABELS[targetType]}的数据源`)
        return
      }
      const trimmed = keyword.trim()
      if (!trimmed) {
        toast.error('请输入名称或 id')
        return
      }

      setIsSearching(true)
      try {
        const response = await searchGameImages({
          source: activeSource,
          keyword: trimmed,
          imageType: targetType,
          includeNsfw,
        })

        const items = response.data.items || []
        setMatchedGameName(response.data.game?.name || '')
        setImages(items)
        setSelectedUrl('')

        if (items.length === 0) {
          toast.error('未搜索到图片')
        }
      } catch (error) {
        const err = error as {
          response?: { data?: { error?: string } }
          message?: string
        }
        toast.error(err.response?.data?.error || err.message || '搜索图片失败')
      } finally {
        setIsSearching(false)
      }
    },
    [activeSource, includeNsfw, keyword],
  )

  return {
    availableSources,
    source: activeSource,
    keyword,
    setKeyword,
    includeNsfw,
    setIncludeNsfw,
    isSearching,
    matchedGameName,
    images,
    selectedUrl,
    setSelectedUrl,
    prepareSearch,
    handleSourceChange,
    handleSearch,
  }
}
