import { fetchAlbumDetails, saveAlbumToGame } from './import-ost-album'
import { getOstManageList } from '@/api'

import type { MusicSource } from '@/features/ost/types'

export type AlbumImportSuccess = {
  albumId: string
  albumName: string
  ostId?: number
  importedCount: number
  totalCount: number
}

export type AlbumImportSkip = {
  albumId: string
  albumName: string
  reason: 'already-imported'
}

export type AlbumImportFailure = {
  albumId: string
  albumName?: string
  reason: 'fetch-failed' | 'no-songs' | 'import-failed'
  message: string
}

export type AlbumBatchImportResult = {
  imported: AlbumImportSuccess[]
  skipped: AlbumImportSkip[]
  failed: AlbumImportFailure[]
}

/** 批量结果的可读摘要：供 toast 与回传给模型的 message 共用 */
export const describeBatchResult = (result: AlbumBatchImportResult) => {
  const songCount = result.imported.reduce((sum, item) => sum + item.importedCount, 0)
  const summary =
    `已导入 ${result.imported.length} 张专辑（共 ${songCount} 首曲目）；` +
    `跳过 ${result.skipped.length} 张（该游戏已有同名 OST）、失败 ${result.failed.length} 张`

  const detail = [
    ...result.skipped.map((item) => `跳过「${item.albumName}」：已有同名 OST`),
    ...result.failed.map((item) => `失败「${item.albumName ?? item.albumId}」：${item.message}`),
  ].join('；')

  return { songCount, summary, detail }
}

/** 读取该游戏已有的 OST 名称，用于批量导入时跳过重复专辑 */
export const loadExistingOstNames = async (gameId: number): Promise<Set<string>> => {
  const { items } = await getOstManageList({ gameId })
  return new Set(items.map((item) => item.name.trim()).filter(Boolean))
}

/**
 * 逐张导入多张专辑的【全部曲目】：单张失败或重复都不会中断其它专辑，
 * 最终把成功 / 跳过 / 失败三类结果一并回传，让模型能如实汇报。
 */
export const importAlbumsBatch = async (params: {
  gameId: number
  source: MusicSource
  refs: string[]
  existingNames: Set<string>
  allowDuplicate: boolean
}): Promise<AlbumBatchImportResult> => {
  const result: AlbumBatchImportResult = { imported: [], skipped: [], failed: [] }

  for (const ref of params.refs) {
    const fetched = await fetchAlbumDetails(params.source, ref)

    if (!fetched.ok) {
      result.failed.push({
        albumId: fetched.shortRef,
        reason: 'fetch-failed',
        message: fetched.message,
      })
      continue
    }

    const { details, shortRef } = fetched
    const albumName = details.name.trim()

    if (details.songs.length === 0) {
      result.failed.push({
        albumId: shortRef,
        albumName,
        reason: 'no-songs',
        message: `专辑「${albumName || shortRef}」没有取到曲目，已跳过`,
      })
      continue
    }

    if (!params.allowDuplicate && params.existingNames.has(albumName)) {
      result.skipped.push({ albumId: shortRef, albumName, reason: 'already-imported' })
      continue
    }

    try {
      const saved = await saveAlbumToGame({
        gameId: params.gameId,
        source: params.source,
        details,
      })
      result.imported.push({
        albumId: shortRef,
        albumName,
        ostId: saved.ostId,
        importedCount: saved.importedCount,
        totalCount: saved.totalCount,
      })
      params.existingNames.add(albumName)
    } catch (error) {
      result.failed.push({
        albumId: shortRef,
        albumName,
        reason: 'import-failed',
        message: error instanceof Error && error.message ? error.message : '未知错误',
      })
    }
  }

  return result
}
