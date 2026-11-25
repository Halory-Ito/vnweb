import { searchGameImages } from '@/api'
import {
  GAME_IMAGE_SOURCES,
  isGameImageSource,
  supportsGameImageType,
  type GameImageSource,
} from '@/lib/game-image-sources'

import type { GameInfo, GameSearchImageItem } from '@/types'

// 默认图片来源：SteamGrid DB
export const DEFAULT_GAME_IMAGE_SOURCE: GameImageSource = 'steamgriddb'

export type GameImageAssetType = 'cover' | 'bg' | 'icon' | 'logo'

export const GAME_IMAGE_ASSET_TYPES: GameImageAssetType[] = ['cover', 'bg', 'icon', 'logo']

export const GAME_IMAGE_ASSET_LABEL_MAP: Record<GameImageAssetType, string> = {
  cover: '封面',
  bg: '背景',
  icon: '图标',
  logo: '徽标',
}

export type GameImages = Partial<Record<GameImageAssetType, string>>

export type FetchGameImagesResult = {
  source: string
  matchedGameId: string | number | null
  matchedKeyword: string
  images: GameImages
  missing: GameImageAssetType[]
}

type ImageSearchResponse = {
  game: { id: string | number; name: string } | null
  items: GameSearchImageItem[]
}

const uniqueKeywords = (values: Array<string | undefined>) => {
  const result: string[] = []

  for (const value of values) {
    const trimmed = (value ?? '').trim()
    if (trimmed && !result.includes(trimmed)) {
      result.push(trimmed)
    }
  }

  return result
}

const safeSearchImages = async (params: {
  source: GameImageSource
  keyword: string
  imageType: GameImageAssetType
}): Promise<ImageSearchResponse> => {
  try {
    const response = await searchGameImages({
      source: params.source,
      keyword: params.keyword,
      imageType: params.imageType,
    })

    return {
      game: response.data.game
        ? { id: response.data.game.id, name: response.data.game.name }
        : null,
      items: response.data.items ?? [],
    }
  } catch (error) {
    console.error(`Search ${params.imageType} image failed:`, error)
    return { game: null, items: [] }
  }
}

/**
 * 从指定图片来源（默认 SteamGrid DB）获取游戏的封面、背景、图标、徽标。
 *
 * 先用「游戏原名 / 中文名 / 输入关键词 / 别名」依次在 SteamGrid DB 上定位游戏，
 * 再用其 id 精确拉取四种图片，保证四张图来自同一游戏并提高中文游戏命中率。
 * 若某个候选命中的游戏没有任何图片（常为误匹配），则自动回退到下一个候选。
 */
export const fetchGameImages = async (params: {
  gameInfo: GameInfo
  keyword?: string
  source?: string
  allowedTypes?: readonly GameImageAssetType[]
}): Promise<FetchGameImagesResult> => {
  const source =
    (params.source ?? DEFAULT_GAME_IMAGE_SOURCE).trim().toLowerCase() || DEFAULT_GAME_IMAGE_SOURCE

  if (!isGameImageSource(source)) {
    const supported = GAME_IMAGE_SOURCES.map((item) => item.id).join('、')
    throw new Error(`不支持的图片来源「${source}」，当前支持：${supported}`)
  }

  const supportedTypes = GAME_IMAGE_ASSET_TYPES.filter(
    (type) =>
      supportsGameImageType(source, type) &&
      (!params.allowedTypes || params.allowedTypes.includes(type)),
  )

  const images: GameImages = {}
  if (supportedTypes.length === 0) {
    return {
      source,
      matchedGameId: null,
      matchedKeyword: '',
      images,
      missing: [...GAME_IMAGE_ASSET_TYPES],
    }
  }

  // 优先使用数据源返回的原名，其次中文名，再退回用户输入关键词与别名
  const keywords = uniqueKeywords([
    params.gameInfo.name,
    params.gameInfo.nameCn,
    params.keyword,
    ...(params.gameInfo.ailases ?? []),
  ]).slice(0, 6)

  const locateType: GameImageAssetType = supportedTypes.includes('cover')
    ? 'cover'
    : supportedTypes[0]
  const restTypes = supportedTypes.filter((type) => type !== locateType)

  let matchedGameId: string | number | null = null
  let matchedKeyword = ''

  for (const candidate of keywords) {
    // 1. 用候选关键词定位游戏（同时取回对应首选类型资源）
    const locateResult = await safeSearchImages({
      source,
      keyword: candidate,
      imageType: locateType,
    })
    if (!locateResult.game) {
      continue
    }

    // 2. 用游戏 id 精确拉取当前数据源支持的其余图片类型
    const gameKeyword = String(locateResult.game.id)
    const restResults = await Promise.all(
      restTypes.map(
        async (type) =>
          [
            type,
            await safeSearchImages({ source, keyword: gameKeyword, imageType: type }),
          ] as const,
      ),
    )

    const candidateImages: GameImages = {}
    const locateUrl = locateResult.items[0]?.url ?? ''
    if (locateUrl) {
      candidateImages[locateType] = locateUrl
    }
    for (const [type, res] of restResults) {
      const url = res.items[0]?.url ?? ''
      if (url) {
        candidateImages[type] = url
      }
    }

    // 命中游戏但拿不到任何图片，通常是匹配错误，继续尝试下一个候选
    if (Object.keys(candidateImages).length === 0) {
      continue
    }

    Object.assign(images, candidateImages)
    matchedGameId = locateResult.game.id
    matchedKeyword = candidate
    break
  }

  return {
    source,
    matchedGameId,
    matchedKeyword,
    images,
    missing: GAME_IMAGE_ASSET_TYPES.filter((type) => !images[type]),
  }
}
