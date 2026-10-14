'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useWebMCP } from 'usewebmcp'

import { getGameById, syncSteamPvsByGameId } from '@/api'
import { searchSteamGamesByNameApi } from '@/features/game/import-api'
import { SYNC_PV_TOOL_NAME, syncPvToolInputSchema } from '@/webmcp/game/lib/sync-pv-tool-schema'
import {
  buildGameNameCandidates,
  findExternalSourceBinding,
  parseExternalSourceIds,
  resolveTargetGame,
  searchWithGameNameCandidates,
} from '@/webmcp/lib'

/** Steam 商店搜索结果最多回传几个候选 */
const MAX_STEAM_RESULTS = 5

/** Steam AppID 只能是非零纯数字，与服务端 resolveSteamAppId 的校验保持一致 */
const normalizeSteamAppId = (raw: string): string => {
  const trimmed = raw.trim()
  if (!/^\d+$/.test(trimmed)) {
    return ''
  }
  const numeric = Number(trimmed)
  return Number.isInteger(numeric) && numeric > 0 ? String(numeric) : ''
}

/**
 * 注册「同步游戏 Steam PV」工具：
 * 按游戏名称 / vndb_id 匹配本地游戏 → 取用（或让用户提供）Steam AppID → 从 Steam 拉取预告片写入 PV 列表。
 * 预期内的失败（缺参、匹配失败、缺 Steam AppID 等）以结构化结果返回，便于模型向用户追问后重试。
 */
export const useSyncPvTool = () => {
  const queryClient = useQueryClient()
  const router = useRouter()

  useWebMCP({
    name: SYNC_PV_TOOL_NAME,
    description:
      '同步指定游戏的 Steam PV（预告片）到 PV 列表。game 传游戏名称或 vndb_id，工具会自动在游戏库中匹配（匹配到多个会返回候选列表）。Steam AppID 的获取顺序：先看 steamAppId 入参，其次用游戏已绑定的 Steam 绑定；两者都没有时，工具会按库内游戏名称（中文名优先）去 Steam 商店搜索，并把候选渲染成卡片让用户确认——此时返回 reason=need-steam-appid，请让用户在卡片上点选，或在拿到 AppID 后带 steamAppId 再次调用。若 Steam 商店也搜不到，返回 reason=steam-appid-not-found（这时需要用户直接提供 AppID；游戏不在 Steam 上则没有 PV 可同步）。若 Steam 未返回可用 PV 或已全部入库，会分别返回 reason=no-pv / already-synced（均非失败）。注意：只能同步 Steam 上的预告片，用户本地的视频文件仍需在界面上传。',
    inputSchema: syncPvToolInputSchema,
    annotations: { readOnlyHint: false },
    execute: async (input) => {
      const keyword = (input.game ?? '').trim()
      if (!keyword) {
        const message = '请提供游戏名称或 vndb_id（game）'
        toast.error(message)
        return { synced: false, reason: 'missing-game', message }
      }

      // 1. 在本地游戏库中定位目标游戏
      const matched = await resolveTargetGame(keyword)
      if (!matched.ok) {
        toast.error(matched.message)
        return { synced: false, reason: matched.reason, message: matched.message }
      }

      const target = matched.game

      // 2. 解析 Steam AppID：入参优先，其次复用游戏已有绑定
      const gameDetail = await getGameById(String(target.id))
      const bindings = parseExternalSourceIds(gameDetail?.externalSourceIds ?? '')
      const boundAppId = findExternalSourceBinding(bindings, 'steam')?.externalId ?? ''

      const requestedAppIdRaw = String(input.steamAppId ?? '').trim()
      let steamAppId = boundAppId

      if (requestedAppIdRaw) {
        steamAppId = normalizeSteamAppId(requestedAppIdRaw)
        if (!steamAppId) {
          const message = `「${requestedAppIdRaw}」不是合法的 Steam AppID，应为纯数字（如 12345）`
          toast.error(message)
          return { synced: false, reason: 'invalid-steam-appid', message }
        }
      }

      if (!steamAppId) {
        // 没有绑定也没传 AppID：用库内游戏名称去 Steam 商店搜索，把候选做成卡片让用户确认
        const candidates = buildGameNameCandidates(target, { preferChinese: true })

        if (candidates.length > 0) {
          const { results, triedKeywords } = await searchWithGameNameCandidates(
            candidates,
            async (candidate) => {
              const searched = await searchSteamGamesByNameApi(candidate, 0, MAX_STEAM_RESULTS)
              return searched.items ?? []
            },
          )

          if (results.length > 0) {
            const options = results.slice(0, MAX_STEAM_RESULTS)
            return {
              synced: false,
              reason: 'need-steam-appid',
              gameId: target.id,
              game: target.title,
              triedKeywords,
              steamCandidates: options.map((item) => ({ appId: item.id, name: item.name })),
              message: `「${target.title}」未绑定 Steam AppID，已按库内名称（${triedKeywords.join('、')}）在 Steam 商店搜到 ${results.length} 个候选。请让用户在卡片上确认要绑定的游戏，或由模型直接再次调用本工具并传 steamAppId。`,
              ui: {
                kind: 'option-picker',
                title: `为「${target.title}」确认 Steam 游戏`,
                description: `按「${triedKeywords.join('」「')}」搜索 Steam 商店 · 共 ${results.length} 个候选（确认后会自动绑定该 AppID 并同步 PV）`,
                options: options.map((item) => ({
                  id: String(item.id),
                  title: item.name,
                  subtitle: `AppID ${item.id}`,
                  badge: 'Steam',
                  send: `用 Steam AppID ${item.id}（${item.name}）同步「${target.title}」的 PV`,
                })),
              },
            }
          }

          const message = `「${target.title}」未绑定 Steam AppID，按库内名称（${triedKeywords.join('、')}）在 Steam 商店也没搜到结果。请让用户提供 steamAppId（纯数字，可在 Steam 商店页地址 /app/<appid>/ 中找到）；若该游戏不在 Steam 上，则没有 Steam PV 可同步。`
          toast.error(message)
          return {
            synced: false,
            reason: 'steam-appid-not-found',
            gameId: target.id,
            game: target.title,
            triedKeywords,
            message,
          }
        }

        const message = `「${target.title}」未绑定 Steam AppID，且游戏库中没有可用于搜索的名称。请让用户提供 steamAppId（纯数字，可在 Steam 商店页地址 /app/<appid>/ 中找到）`
        toast.error(message)
        return {
          synced: false,
          reason: 'need-steam-appid',
          gameId: target.id,
          game: target.title,
          message,
        }
      }

      // 3. 同步（传入 steamAppId 时服务端会顺带绑定 Steam，且不影响其他数据源绑定）
      const result = await syncSteamPvsByGameId(target.id, { steamAppId })

      await queryClient.invalidateQueries({ queryKey: ['game', String(target.id)] })
      await queryClient.invalidateQueries({ queryKey: ['game'] })
      await queryClient.invalidateQueries({ queryKey: ['game-pvs', target.id] })
      await queryClient.invalidateQueries({ queryKey: ['game-cards'] })
      await queryClient.invalidateQueries({ queryKey: ['game-sidebar'] })
      router.refresh()

      if (result.total === 0) {
        const message = `「${target.title}」在 Steam（AppID ${steamAppId}）未返回可用 PV，请确认 AppID 是否正确`
        toast.info(message)
        return {
          synced: false,
          reason: 'no-pv',
          gameId: target.id,
          game: target.title,
          steamAppId,
          message,
        }
      }

      if (result.inserted === 0) {
        const message = `「${target.title}」的 ${result.total} 条 Steam PV 已存在，无需重复入库`
        toast.info(message)
        return {
          synced: false,
          reason: 'already-synced',
          gameId: target.id,
          game: target.title,
          steamAppId,
          total: result.total,
          message,
        }
      }

      toast.success(`已为「${target.title}」同步 ${result.inserted} 条 Steam PV`)

      return {
        synced: true,
        gameId: target.id,
        game: target.title,
        steamAppId,
        total: result.total,
        inserted: result.inserted,
        skipped: result.skipped,
      }
    },
  })
}
