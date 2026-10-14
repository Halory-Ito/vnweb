'use client'

import { toast } from 'sonner'
import { useWebMCP } from 'usewebmcp'

import { searchAlbums } from '@/features/ost/lib/ost-utils'
import {
  buildGameNameCandidates,
  resolveTargetGame,
  searchWithGameNameCandidates,
} from '@/webmcp/lib'
import {
  MAX_ALBUM_RESULTS,
  OST_SOURCES,
  OST_SOURCE_LABEL,
  resolveOstSource,
  toShortAlbumRef,
} from '@/webmcp/ost/lib/ost-tool-shared'
import {
  SEARCH_OST_TOOL_NAME,
  searchOstToolInputSchema,
} from '@/webmcp/ost/lib/search-ost-tool-schema'

/** 按平台优先级去重出候选搜索词（最多两个）：网易云是中文平台优先中文名，khinsider 是英文站优先原名 */

/**
 * 注册「搜索游戏 OST 专辑」工具（只读，不写库）：
 * 按游戏名称 / vndb_id 匹配本地游戏 → 用【库内游戏名称】在指定音源搜索专辑 → 返回候选并在对话里渲染成【可多选】的勾选卡片。
 * 用户确认后，卡片会把所选专辑的 id 作为下一条消息发出，再由模型调用 import_game_ost 完成导入（多张用 albumIds）。
 */
export const useSearchOstTool = () => {
  useWebMCP({
    name: SEARCH_OST_TOOL_NAME,
    description:
      '搜索指定游戏的原声带（OST）专辑，返回候选专辑并在对话里渲染成【可多选的勾选卡片】，让用户自己挑（勾选后确认，所选专辑的 id 会作为下一条消息发出）。game 传游戏名称或 vndb_id，工具会先在游戏库中匹配出该游戏，再用【游戏在库中的名称】去搜索（网易云用中文名、khinsider 用原名；第一个名称搜不到时会自动换另一个名称再试一次）。keyword 可显式覆盖搜索词（例如库内名称搜不到时直接给专辑名）；source 可选 khinsider（默认）或 netease。本工具只搜索、不写库——用户确认后，请调用 import_game_ost 导入：一次选中多张时用 albumIds 传全部 id（工具会导入每张专辑的全部曲目），只选一张且需要挑曲目时用 albumId 并省略 songIndexes。',
    inputSchema: searchOstToolInputSchema,
    annotations: { readOnlyHint: true },
    execute: async (input) => {
      const gameInput = (input.game ?? '').trim()
      if (!gameInput) {
        const message = '请提供游戏名称或 vndb_id（game）'
        toast.error(message)
        return { found: false, reason: 'missing-game', message }
      }

      const sourceResult = resolveOstSource(input.source)
      if (!sourceResult.ok) {
        const message = `不支持的音源「${sourceResult.invalid}」，可选：${OST_SOURCES.join('、')}`
        toast.error(message)
        return { found: false, reason: 'unsupported-source', message }
      }

      const source = sourceResult.source

      // 先定位游戏：搜索词必须来自库内的游戏名称，不能直接用 game 入参（它可能是 vndb_id）
      const matched = await resolveTargetGame(gameInput)
      if (!matched.ok) {
        toast.error(matched.message)
        return { found: false, reason: matched.reason, message: matched.message }
      }

      const target = matched.game
      const candidates = buildGameNameCandidates(target, {
        // 网易云是中文平台，中文名命中率更高；khinsider 是英文站，原名更准
        preferChinese: source === 'netease',
        explicit: input.keyword,
      })

      if (candidates.length === 0) {
        const message = `「${target.title}」在游戏库中没有可用于搜索的名称，请用 keyword 显式指定搜索词`
        toast.error(message)
        return {
          found: false,
          reason: 'missing-keyword',
          gameId: target.id,
          game: target.title,
          source,
          message,
        }
      }

      // 逐个候选搜索词尝试（最多两次），命中即停
      const {
        results: albums,
        keyword,
        triedKeywords,
      } = await searchWithGameNameCandidates(candidates, (candidate) =>
        searchAlbums(candidate, source),
      )

      if (albums.length === 0) {
        const message = `在 ${OST_SOURCE_LABEL[source]} 中用「${triedKeywords.join('」「')}」都没有搜到专辑，可换个 keyword 或音源（source）再试`
        toast.error(message)
        return {
          found: false,
          reason: 'no-results',
          gameId: target.id,
          game: target.title,
          source,
          triedKeywords,
          message,
        }
      }

      const options = albums.slice(0, MAX_ALBUM_RESULTS)

      return {
        found: true,
        gameId: target.id,
        game: target.title,
        source,
        keyword,
        triedKeywords,
        total: albums.length,
        albums: options.map((album) => ({
          id: toShortAlbumRef(source, String(album.id)),
          name: album.name,
          url: album.url,
          year: album.year,
          artist: album.artist,
          songCount: album.songCount,
          cover: album.cover,
        })),
        ui: {
          kind: 'checkbox-list',
          title: `为「${target.title}」选择要导入的 OST 专辑`,
          description: `${OST_SOURCE_LABEL[source]} · 关键词「${keyword}」· 共 ${albums.length} 张${
            albums.length > options.length ? `（仅显示前 ${options.length} 张）` : ''
          } · 可多选，导入每张的全部曲目`,
          // 涉及写库：默认不勾选，避免误点确认就把全部候选都导进去
          defaultChecked: false,
          items: options.map((album) => ({
            id: toShortAlbumRef(source, String(album.id)),
            label: album.name,
            meta:
              [
                album.artist,
                album.year ? `${album.year} 年` : '',
                album.songCount ? `${album.songCount} 首` : '',
              ]
                .filter(Boolean)
                .join(' · ') || OST_SOURCE_LABEL[source],
            image: album.cover || undefined,
            badge: OST_SOURCE_LABEL[source],
          })),
          confirmLabel: '导入已选专辑',
          sendPrefix: `把这些专辑的全部曲目导入「${target.title}」的 OST（source=${source}）：`,
        },
      }
    },
  })
}
