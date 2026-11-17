import {
  createGameInfoApi,
  getGameInfoByIdApi,
  importSteamGameApi,
  searchBangumiCollectedGamesApi,
  searchSteamOwnedGamesApi,
  searchVndbUserListApi,
  searchYmgalUserGamesApi,
} from '../import-api'

import type { GameLibraryImportProvider } from '../data/game-library-import-providers'
import type { SteamOwnedGameItem } from '../import-api'

export type GameLibraryImportItem = {
  id: string
  name: string
  coverUrl: string
  detail: string
  note?: string
  alreadyImported: boolean
  steamGame?: SteamOwnedGameItem
}

export type GameLibraryImportStatus = 'idle' | 'importing' | 'imported' | 'skipped' | 'failed'

export type GameLibraryImportRow = GameLibraryImportItem & {
  selected: boolean
  status: GameLibraryImportStatus
  reason: string
}

export type GameLibraryImportResult = {
  status: 'imported' | 'skipped'
  reason?: string
}

const COLLECTION_SEARCH = {
  bangumi: searchBangumiCollectedGamesApi,
  vndb: searchVndbUserListApi,
  ymgal: searchYmgalUserGamesApi,
}

export async function readGameLibrary(provider: GameLibraryImportProvider, steamUid: string) {
  if (provider === 'steam') {
    const result = await searchSteamOwnedGamesApi(steamUid)
    return result.data.items.map(
      (item): GameLibraryImportItem => ({
        id: String(item.appid),
        name: item.name,
        coverUrl: item.iconUrl,
        detail: `${(item.playtimeMinutes / 60).toFixed(1)} 小时`,
        alreadyImported: item.alreadyImported,
        steamGame: item,
      }),
    )
  }

  const result = await COLLECTION_SEARCH[provider]()
  return result.data.items.map(
    (item): GameLibraryImportItem => ({
      id: item.id,
      name: item.name,
      coverUrl: item.coverUrl,
      detail: item.date || '-',
      note: item.note || item.id,
      alreadyImported: item.alreadyImported,
    }),
  )
}

export async function importGameLibraryItem(
  provider: GameLibraryImportProvider,
  steamUid: string,
  item: GameLibraryImportItem,
): Promise<GameLibraryImportResult> {
  if (provider === 'steam') {
    if (!item.steamGame) throw new Error('未获取到 Steam 游戏信息')
    const { appid, name, playtimeMinutes, coverUrl, iconUrl, logoUrl } = item.steamGame
    const result = await importSteamGameApi({
      steamId: steamUid,
      appid,
      name,
      playtimeMinutes,
      coverUrl,
      iconUrl,
      logoUrl,
    })
    return result.data
  }

  const gameInfo = await getGameInfoByIdApi(item.id, provider)
  if (!gameInfo) throw new Error('未获取到游戏详情')
  await createGameInfoApi(gameInfo, { provider, externalId: item.id })
  return { status: 'imported' }
}
