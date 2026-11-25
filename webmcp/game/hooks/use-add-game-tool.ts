'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useRef } from 'react'
import { toast } from 'sonner'
import { useWebMCP } from 'usewebmcp'

import { updateGameInfoById } from '@/api'
import {
  createGameInfoApi,
  getGameInfoByIdApi,
  searchGameByNameApi,
} from '@/features/game/import-api'
import { useEnabledPlatforms } from '@/hooks/use-enabled-platforms'
import {
  GAME_IMAGE_SOURCES,
  isGameImageSource,
  supportsGameImageType,
  type GameImageSource,
} from '@/lib/game-image-sources'
import { getManualSearchProviderOptions } from '@/lib/providers'
import {
  GAME_IMAGE_TYPE_TO_FEATURE_CATEGORY,
  isPlatformVisibilityKey,
  type PlatformFeatureCategory,
  type PlatformVisibilityKey,
} from '@/lib/settings/platform-visibility'
import { ADD_GAME_TOOL_NAME, addGameToolInputSchema } from '@/webmcp/game/lib/add-game-tool-schema'
import {
  DEFAULT_GAME_IMAGE_SOURCE,
  GAME_IMAGE_ASSET_LABEL_MAP,
  GAME_IMAGE_ASSET_TYPES,
  fetchGameImages,
  type GameImageAssetType,
  type GameImages,
} from '@/webmcp/game/lib/fetch-game-images'

import type { GameInfo } from '@/types'

// 默认数据源：VNDB
const DEFAULT_GAME_PROVIDER = 'vndb'

type FeatureCheck = (key: PlatformVisibilityKey, category?: PlatformFeatureCategory) => boolean

const resolveProvider = (requested: string | undefined, isPlatformEnabled: FeatureCheck) => {
  const options = getManualSearchProviderOptions().filter((option) =>
    isPlatformVisibilityKey(option.value) ? isPlatformEnabled(option.value, 'game-metadata') : true,
  )
  const value = requested?.trim()

  if (options.length === 0) {
    throw new Error('未开启任何游戏数据源，请先在「设置 → 平台」开启至少一个数据源')
  }

  if (value) {
    if (!options.some((option) => option.value === value)) {
      const available = options.map((option) => option.value).join('、')
      throw new Error(`数据源「${value}」未开启或不受支持，可选数据源：${available}`)
    }
    return value
  }

  // 未指定时优先使用 VNDB，不可用时回退到首个可用数据源
  if (options.some((option) => option.value === DEFAULT_GAME_PROVIDER)) {
    return DEFAULT_GAME_PROVIDER
  }

  return options[0]?.value ?? DEFAULT_GAME_PROVIDER
}

const getEnabledTypesForSource = (
  sourceId: GameImageSource,
  isPlatformEnabled: FeatureCheck,
): GameImageAssetType[] =>
  GAME_IMAGE_ASSET_TYPES.filter(
    (type) =>
      supportsGameImageType(sourceId, type) &&
      isPlatformEnabled(sourceId, GAME_IMAGE_TYPE_TO_FEATURE_CATEGORY[type]),
  )

const resolveImageSource = (
  requested: string | undefined,
  isPlatformEnabled: FeatureCheck,
): GameImageSource | null => {
  const enabledSources = GAME_IMAGE_SOURCES.filter(
    (item) => getEnabledTypesForSource(item.id, isPlatformEnabled).length > 0,
  )
  const value = requested?.trim()

  if (value) {
    if (!isGameImageSource(value) || !enabledSources.some((item) => item.id === value)) {
      const available = enabledSources.map((item) => item.id).join('、') || '（无已开启图片来源）'
      throw new Error(`图片来源「${value}」未在「设置 → 平台」中开启或不受支持，可选：${available}`)
    }
    return value
  }

  if (enabledSources.length === 0) return null
  if (enabledSources.some((item) => item.id === DEFAULT_GAME_IMAGE_SOURCE)) {
    return DEFAULT_GAME_IMAGE_SOURCE
  }
  return enabledSources[0]?.id ?? null
}

/**
 * 注册「搜索游戏并加入游戏库」工具：
 * 自动搜索游戏 → 获取详情 → 入库 → 从已启用的图片来源获取并配置封面/背景/图标/徽标。
 */
export const useAddGameTool = () => {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { isPlatformEnabled } = useEnabledPlatforms()
  const isPlatformEnabledRef = useRef(isPlatformEnabled)
  isPlatformEnabledRef.current = isPlatformEnabled

  useWebMCP({
    name: ADD_GAME_TOOL_NAME,
    description:
      '搜索游戏并自动添加到游戏库，同时从已开启的图片源（默认 SteamGrid DB）获取并配置封面（cover）、背景（bg）、图标（icon）和徽标（logo）。只需提供游戏名称关键词，工具会自动完成搜索、匹配、入库与图片配置。',
    inputSchema: addGameToolInputSchema,
    annotations: { readOnlyHint: false },
    execute: async (input) => {
      const keyword = (input.keyword ?? '').trim()
      if (!keyword) {
        throw new Error('请提供游戏名称关键词 keyword')
      }

      const provider = resolveProvider(input.provider, isPlatformEnabledRef.current)
      const imageSource = resolveImageSource(input.imageSource, isPlatformEnabledRef.current)

      let externalId = (input.externalId ?? '').trim()
      let gameInfo: GameInfo | null = null

      if (externalId) {
        gameInfo = await getGameInfoByIdApi(externalId, provider)
      } else {
        const searchResult = await searchGameByNameApi(keyword, provider, 0, 1)
        const first = searchResult.items[0]

        if (!first) {
          throw new Error(`在数据源「${provider}」中未搜索到「${keyword}」`)
        }

        externalId = first.id
        gameInfo = await getGameInfoByIdApi(first.id, provider)
      }

      if (!gameInfo || !gameInfo.name) {
        throw new Error('未能获取游戏详情，请检查名称或 ID 是否正确')
      }

      const created = await createGameInfoApi(gameInfo, { provider, externalId })
      const gameId = created?.data?.id

      if (!gameId) {
        throw new Error('游戏创建失败')
      }

      // 从已启用的图片来源与功能分类获取封面、背景、图标、徽标
      const enabledImageTypes = imageSource
        ? getEnabledTypesForSource(imageSource, isPlatformEnabledRef.current)
        : []
      const imageResult =
        imageSource && enabledImageTypes.length > 0
          ? await fetchGameImages({
              gameInfo,
              keyword,
              source: imageSource,
              allowedTypes: enabledImageTypes,
            })
          : { images: {}, matchedGameId: null, matchedKeyword: keyword }
      const images: GameImages = { ...imageResult.images }

      // 封面兜底：图片源未命中或未开启时复用数据源自带封面
      const fallbackCover = gameInfo.cover.trim()
      if (!images.cover && fallbackCover) {
        images.cover = fallbackCover
      }

      const missingImages = GAME_IMAGE_ASSET_TYPES.filter((type) => !images[type])

      if (Object.keys(images).length > 0) {
        await updateGameInfoById(gameId, images)
      }

      await queryClient.invalidateQueries({ queryKey: ['game'] })
      await queryClient.invalidateQueries({ queryKey: ['game-cards'] })
      await queryClient.invalidateQueries({ queryKey: ['game-sidebar'] })
      router.refresh()

      const name = gameInfo.nameCn || gameInfo.name

      if (missingImages.length > 0) {
        const labels = missingImages.map((type) => GAME_IMAGE_ASSET_LABEL_MAP[type]).join('、')
        toast.warning(`已添加游戏「${name}」，但未获取到：${labels}`)
      } else {
        toast.success(`已添加游戏「${name}」并配置好封面/背景/图标/徽标`)
      }

      return {
        id: gameId,
        name,
        provider,
        externalId,
        imageSource: imageSource ?? '',
        matchedGameId: imageResult.matchedGameId,
        matchedKeyword: imageResult.matchedKeyword,
        images,
        missingImages,
      }
    },
  })
}
