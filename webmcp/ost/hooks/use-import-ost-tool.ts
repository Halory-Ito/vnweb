'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useWebMCP } from 'usewebmcp'

import { resolveTargetGame } from '@/webmcp/lib'
import {
  describeBatchResult,
  importAlbumsBatch,
  loadExistingOstNames,
} from '@/webmcp/ost/lib/import-ost-batch'
import { importSingleAlbum } from '@/webmcp/ost/lib/import-ost-single'
import {
  IMPORT_OST_TOOL_NAME,
  importOstToolInputSchema,
} from '@/webmcp/ost/lib/import-ost-tool-schema'
import {
  MAX_ALBUM_IMPORT,
  OST_SOURCES,
  collectAlbumRefs,
  resolveOstSource,
} from '@/webmcp/ost/lib/ost-tool-shared'

const DESCRIPTION = [
  '把 OST 专辑（及其曲目）导入指定游戏的 OST 列表。',
  'game 传游戏名称或 vndb_id；source / albumId(s) 用 search_game_ost 返回的值（khinsider 的 albumId 可传专辑页 slug 或完整 URL，netease 传数字 id）。',
  '两种用法：①【多张一次导入】用户在卡片上勾选多张专辑后，把它们的 id 全部放进 albumIds，工具会逐张拉取并导入每张专辑的【全部曲目】（某一张失败或重复不会中断其它专辑）；',
  '②【单张 + 挑曲目】只传 albumId 且不传 songIndexes 时【不会写库】，而是返回曲目选择卡片让用户勾选（默认全选），用户选完后会以「这些曲目」追问，此时再带上 songIndexes（从 1 开始，与卡片顺序一致）调用即可完成导入。',
  '默认会跳过该游戏已有的同名 OST（结果里回报 already-imported），只有用户明确要求「再导一次」时才传 allowDuplicate=true。曲目只保存远程 URL，不下载音频文件。',
].join('')

/**
 * 注册「导入游戏 OST 专辑」工具：
 * 多张专辑（albumIds）→ 逐张整张导入，单张失败/重复不影响其它；
 * 单张专辑（albumId）→ 未指定 songIndexes 时返回曲目选择卡片（不写库），指定后按所选曲目入库。
 */
export const useImportOstTool = () => {
  const queryClient = useQueryClient()
  const router = useRouter()

  const refreshOst = async () => {
    await queryClient.invalidateQueries({ queryKey: ['ost-manage'] })
    await queryClient.invalidateQueries({ queryKey: ['ost-songs'] })
    await queryClient.invalidateQueries({ queryKey: ['game'] })
    router.refresh()
  }

  useWebMCP({
    name: IMPORT_OST_TOOL_NAME,
    description: DESCRIPTION,
    inputSchema: importOstToolInputSchema,
    annotations: { readOnlyHint: false },
    execute: async (input) => {
      const gameKeyword = (input.game ?? '').trim()
      if (!gameKeyword) {
        const message = '请提供游戏名称或 vndb_id（game）'
        toast.error(message)
        return { imported: false, reason: 'missing-game', message }
      }

      const sourceResult = resolveOstSource(input.source)
      if (!sourceResult.ok) {
        const message = `不支持的音源「${sourceResult.invalid}」，可选：${OST_SOURCES.join('、')}`
        toast.error(message)
        return { imported: false, reason: 'unsupported-source', message }
      }

      const refs = collectAlbumRefs(input.albumId, input.albumIds)
      if (refs.length === 0) {
        const message =
          '请提供专辑 albumId（单张）或 albumIds（多张），用 search_game_ost 返回的 id'
        toast.error(message)
        return { imported: false, reason: 'missing-album-id', message }
      }

      if (refs.length > MAX_ALBUM_IMPORT) {
        const message = `一次最多导入 ${MAX_ALBUM_IMPORT} 张专辑（本次 ${refs.length} 张），请分批导入`
        toast.error(message)
        return { imported: false, reason: 'too-many-albums', albumCount: refs.length, message }
      }

      const matched = await resolveTargetGame(gameKeyword)
      if (!matched.ok) {
        toast.error(matched.message)
        return { imported: false, reason: matched.reason, message: matched.message }
      }

      const target = matched.game
      const source = sourceResult.source
      const allowDuplicate = input.allowDuplicate === true
      const existingNames = await loadExistingOstNames(target.id)

      // 多张专辑：一次导入每张的全部曲目
      if (refs.length > 1) {
        const result = await importAlbumsBatch({
          gameId: target.id,
          source,
          refs,
          existingNames,
          allowDuplicate,
        })

        if (result.imported.length > 0) {
          await refreshOst()
        }

        const { songCount, summary, detail } = describeBatchResult(result)

        if (result.imported.length === 0) {
          toast.error(`没有导入任何专辑。${detail}`)
        } else if (detail) {
          toast.info(`已导入 ${result.imported.length} 张专辑。${detail}`)
        } else {
          toast.success(
            `已为「${target.title}」导入 ${result.imported.length} 张专辑（${songCount} 首）`,
          )
        }

        return {
          imported: result.imported.length > 0,
          gameId: target.id,
          game: target.title,
          source,
          albumCount: refs.length,
          importedAlbums: result.imported,
          skippedAlbums: result.skipped,
          failedAlbums: result.failed,
          message: detail ? `${summary}。${detail}` : summary,
        }
      }

      // 单张专辑：先选曲（或直接导入全部）
      const result = await importSingleAlbum({
        target,
        source,
        ref: refs[0],
        songIndexes: input.songIndexes,
        existingNames,
        allowDuplicate,
      })

      if (result.kind === 'imported') {
        await refreshOst()
        toast.success(
          `已为「${target.title}」导入 OST「${result.payload.albumName}」（${result.payload.importedCount}/${result.payload.totalCount} 首）`,
        )
      } else if (result.kind === 'need-track-selection') {
        toast.info(`已获取专辑「${result.payload.albumName}」的曲目，请在卡片里勾选要导入的曲目`)
      } else if (result.kind === 'already-imported') {
        toast.info(String(result.payload.message))
      } else {
        toast.error(String(result.payload.message))
      }

      return result.payload
    },
  })
}
