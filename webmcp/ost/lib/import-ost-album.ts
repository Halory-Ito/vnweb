import { normalizeAlbumRef, toShortAlbumRef } from './ost-tool-shared'
import { createOstManageItem } from '@/api'
import { getAlbumDetails } from '@/features/ost/lib/ost-utils'

import type { MusicSource, UnifiedAlbumDetails } from '@/features/ost/types'

export type FetchAlbumDetailsResult =
  | { ok: true; shortRef: string; details: UnifiedAlbumDetails }
  | { ok: false; shortRef: string; message: string }

const toErrorMessage = (error: unknown): string =>
  error instanceof Error && error.message ? error.message : '未知错误'

/**
 * 拉取专辑详情。失败时把原因作为返回值而不是抛错，
 * 这样批量导入可以「跳过这一张、继续下一张」。
 */
export const fetchAlbumDetails = async (
  source: MusicSource,
  rawRef: string,
): Promise<FetchAlbumDetailsResult> => {
  const shortRef = toShortAlbumRef(source, rawRef)

  try {
    const albumRef = normalizeAlbumRef(source, rawRef)
    const details = await getAlbumDetails(
      source,
      source === 'netease' ? Number(albumRef) : albumRef,
    )
    return { ok: true, shortRef, details }
  } catch (error) {
    return {
      ok: false,
      shortRef,
      message: `拉取专辑「${shortRef}」详情失败：${toErrorMessage(error)}`,
    }
  }
}

/** 曲目序号（1 起）转成待写入的曲目列表；不传序号表示整张导入 */
export const buildAlbumSongs = (details: UnifiedAlbumDetails, songIndexes?: number[]) => {
  const indexes = songIndexes?.length ? songIndexes : details.songs.map((_, index) => index + 1)

  return indexes
    .map((index) => details.songs[index - 1])
    .filter((song) => Boolean(song))
    .map((song) => ({ name: song.name, url: song.url }))
}

/** 把专辑（整张或指定曲目）写入该游戏的 OST 列表 */
export const saveAlbumToGame = async (params: {
  gameId: number
  source: MusicSource
  details: UnifiedAlbumDetails
  songIndexes?: number[]
}) => {
  const songs = buildAlbumSongs(params.details, params.songIndexes)

  const created = await createOstManageItem({
    gameId: params.gameId,
    name: params.details.name,
    cover: params.details.cover,
    resource: params.source,
    songs,
  })

  return {
    ostId: created?.data?.item?.id,
    importedCount: songs.length,
    totalCount: params.details.songs.length,
  }
}
