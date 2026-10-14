import { fetchAlbumDetails, saveAlbumToGame } from './import-ost-album'
import { OST_SOURCE_LABEL } from './ost-tool-shared'

import type { MusicSource } from '@/features/ost/types'

/** 把曲目序号（1 起）过滤、去重、排序，并限制在有效范围内 */
export const normalizeSongIndexes = (raw: unknown, total: number): number[] => {
  if (!Array.isArray(raw)) {
    return []
  }

  return [
    ...new Set(
      raw
        .map((item) => Number(item))
        .filter((item) => Number.isInteger(item) && item >= 1 && item <= total),
    ),
  ].sort((left, right) => left - right)
}

/**
 * 单张专辑导入：
 * 拉详情 → 同名 OST 已存在则跳过 → 未指定曲目时返回「选曲卡片」（不写库）→ 否则按所选曲目入库。
 * 只返回结果对象，toast 与缓存刷新交给调用方。
 */
export const importSingleAlbum = async (params: {
  target: { id: number; title: string }
  source: MusicSource
  ref: string
  songIndexes?: number[]
  existingNames: Set<string>
  allowDuplicate: boolean
}) => {
  const fetched = await fetchAlbumDetails(params.source, params.ref)
  const shortRef = fetched.shortRef
  const base = {
    gameId: params.target.id,
    game: params.target.title,
    source: params.source,
    albumId: shortRef,
  }

  if (!fetched.ok) {
    return {
      kind: 'fetch-failed' as const,
      payload: { imported: false, reason: 'fetch-failed', ...base, message: fetched.message },
    }
  }

  const { details } = fetched

  if (details.songs.length === 0) {
    const message = `专辑「${details.name || params.ref}」没有取到曲目，请确认 albumId 是否正确`
    return {
      kind: 'no-songs' as const,
      payload: { imported: false, reason: 'no-songs', ...base, message },
    }
  }

  if (!params.allowDuplicate && params.existingNames.has(details.name.trim())) {
    const message = `「${params.target.title}」的 OST 里已经有同名专辑「${details.name}」，本次已跳过；若确实要再导入一次，请带 allowDuplicate=true 重新调用。`
    return {
      kind: 'already-imported' as const,
      payload: {
        imported: false,
        reason: 'already-imported',
        ...base,
        albumName: details.name,
        message,
      },
    }
  }

  const total = details.songs.length
  const songIndexes = normalizeSongIndexes(params.songIndexes, total)

  if (songIndexes.length === 0) {
    return {
      kind: 'need-track-selection' as const,
      payload: {
        imported: false,
        reason: 'need-track-selection',
        ...base,
        albumName: details.name,
        songCount: total,
        songs: details.songs.map((song, index) => ({
          index: index + 1,
          name: song.name,
          artist: song.artist,
          duration: song.duration,
        })),
        message: `已获取专辑「${details.name}」的 ${total} 首曲目。请让用户在卡片上勾选要导入的曲目（默认全选），或由模型直接再次调用本工具并传 songIndexes（从 1 开始）；若用户想整张导入，也可用 albumIds 传单个 id 一次性导入全部曲目。`,
        ui: {
          kind: 'checkbox-list',
          title: `选择要导入的曲目 · ${details.name}`,
          description: `共 ${total} 首 · 将写入「${params.target.title}」的 OST（${OST_SOURCE_LABEL[params.source]}）`,
          items: details.songs.map((song, index) => ({
            id: String(index + 1),
            label: `${index + 1}. ${song.name}`,
            meta: [song.artist, song.duration].filter(Boolean).join(' · ') || undefined,
          })),
          confirmLabel: '导入已选曲目',
          sendPrefix: `把专辑「${details.name}」的这些曲目导入「${params.target.title}」的 OST（source=${params.source}, albumId=${shortRef}）：`,
        },
      },
    }
  }

  const saved = await saveAlbumToGame({
    gameId: params.target.id,
    source: params.source,
    details,
    songIndexes,
  })

  return {
    kind: 'imported' as const,
    payload: {
      imported: true,
      ...base,
      albumName: details.name,
      ostId: saved.ostId,
      importedCount: saved.importedCount,
      totalCount: total,
      songIndexes,
    },
  }
}
