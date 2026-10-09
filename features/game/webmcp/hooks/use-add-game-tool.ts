'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useWebMCP } from 'usewebmcp'

import { updateGameInfoById } from '@/api'
import {
  createGameInfoApi,
  getGameInfoByIdApi,
  searchGameByNameApi,
} from '@/features/game/import-api'
import {
  ADD_GAME_TOOL_NAME,
  addGameToolInputSchema,
} from '@/features/game/webmcp/lib/add-game-tool-schema'
import {
  DEFAULT_GAME_IMAGE_SOURCE,
  GAME_IMAGE_ASSET_LABEL_MAP,
  GAME_IMAGE_ASSET_TYPES,
  fetchGameImages,
  type GameImages,
} from '@/features/game/webmcp/lib/fetch-game-images'
import { getManualSearchProviderOptions } from '@/lib/providers'

import type { GameInfo } from '@/types'

// 默认数据源：VNDB
const DEFAULT_GAME_PROVIDER = 'vndb'

const resolveProvider = (requested?: string) => {
  const options = getManualSearchProviderOptions()
  const value = requested?.trim()

  if (value) {
    if (!options.some((option) => option.value === value)) {
      const available = options.map((option) => option.value).join('、') || '（无可用数据源）'
      throw new Error(`不支持的数据源「${value}」，可选数据源：${available}`)
    }
    return value
  }

  // 未指定时优先使用 VNDB，不可用时回退到首个可用数据源
  if (options.some((option) => option.value === DEFAULT_GAME_PROVIDER)) {
    return DEFAULT_GAME_PROVIDER
  }

  return options[0]?.value ?? DEFAULT_GAME_PROVIDER
}

/**
 * 注册「搜索游戏并加入游戏库」工具：
 * 自动搜索游戏 → 获取详情 → 入库 → 从 SteamGrid DB 获取并配置封面/背景/图标/徽标。
 */
export const useAddGameTool = () => {
  const queryClient = useQueryClient()
  const router = useRouter()

  useWebMCP({
    name: ADD_GAME_TOOL_NAME,
    description:
      '搜索游戏并自动添加到游戏库，同时从 SteamGrid DB 获取并配置封面（cover）、背景（bg）、图标（icon）和徽标（logo）。只需提供游戏名称关键词，工具会自动完成搜索、匹配、入库与图片配置。',
    inputSchema: addGameToolInputSchema,
    annotations: { readOnlyHint: false },
    execute: async (input) => {
      const keyword = (input.keyword ?? '').trim()
      if (!keyword) {
        throw new Error('请提供游戏名称关键词 keyword')
      }

      const provider = resolveProvider(input.provider)
      const imageSource = (input.imageSource ?? '').trim() || DEFAULT_GAME_IMAGE_SOURCE

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

      // 显式从 SteamGrid DB 获取封面、背景、图标、徽标
      const imageResult = await fetchGameImages({ gameInfo, keyword, source: imageSource })
      const images: GameImages = { ...imageResult.images }

      // 封面兜底：SteamGrid DB 未命中时复用数据源自带封面
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
        imageSource,
        matchedGameId: imageResult.matchedGameId,
        matchedKeyword: imageResult.matchedKeyword,
        images,
        missingImages,
      }
    },
  })
}
