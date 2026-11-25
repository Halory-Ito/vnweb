import {
  searchDanbooruImages,
  searchGelbooruImages,
  searchMoebooruImages,
  searchSafebooruImages,
  searchWallhavenImages,
} from './game-image-search/booru-sources'
import {
  searchGiantBombImages,
  searchIgdbImages,
  searchRawgImages,
  searchTheGamesDbImages,
} from './game-image-search/game-db-sources'
import {
  searchBangumiImages,
  searchSteamGridDBImages,
  searchSteamImages,
  searchVndbImages,
} from './game-image-search/public-sources'
import {
  DEFAULT_GAME_IMAGE_SOURCE,
  type GameImageSource,
  type GameImageType,
} from '@/lib/game-image-sources'

import type { ImageSearchResult } from './game-image-search/shared'

export type { ImageSearchResult }

/** 按指定图源搜索游戏封面、背景、图标或徽标资源。 */
export async function searchGameImagesFromSource({
  source = DEFAULT_GAME_IMAGE_SOURCE,
  keyword,
  imageType,
  includeNsfw,
}: {
  source?: GameImageSource
  keyword: string
  imageType: GameImageType
  includeNsfw?: boolean
}): Promise<ImageSearchResult> {
  switch (source) {
    case 'vndb':
      return searchVndbImages(keyword, imageType, includeNsfw ?? false)
    case 'steam':
      return searchSteamImages(keyword, imageType)
    case 'bangumi':
      return searchBangumiImages(keyword)
    case 'yandere':
      return searchMoebooruImages('yandere', keyword, imageType, includeNsfw)
    case 'konachan':
      return searchMoebooruImages('konachan', keyword, imageType, includeNsfw)
    case 'safebooru':
      return searchSafebooruImages(keyword, imageType)
    case 'steamgriddb':
      return searchSteamGridDBImages(keyword, imageType)
    case 'igdb':
      return searchIgdbImages(keyword, imageType)
    case 'rawg':
      return searchRawgImages(keyword)
    case 'thegamesdb':
      return searchTheGamesDbImages(keyword, imageType)
    case 'giantbomb':
      return searchGiantBombImages(keyword, imageType)
    case 'danbooru':
      return searchDanbooruImages(keyword, imageType, includeNsfw)
    case 'gelbooru':
      return searchGelbooruImages(keyword, imageType, includeNsfw)
    case 'wallhaven':
      return searchWallhavenImages(keyword, imageType, includeNsfw)
  }
}
