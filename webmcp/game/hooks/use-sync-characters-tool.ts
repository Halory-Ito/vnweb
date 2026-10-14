'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useWebMCP } from 'usewebmcp'

import { getGameById, syncVndbCharactersByGameId, updateGameInfoById } from '@/api'
import { getEnabledCharacterProviders } from '@/lib/plugins'
import {
  SYNC_CHARACTERS_TOOL_NAME,
  syncCharactersToolInputSchema,
} from '@/webmcp/game/lib/sync-characters-tool-schema'
import {
  findExternalSourceBinding,
  parseExternalSourceIds,
  resolveTargetGame,
  serializeExternalSourceIds,
  withoutExternalSourceBinding,
} from '@/webmcp/lib'

// 未指定数据源时的默认源，与服务端 syncVndbCharactersByGameId 的默认值保持一致
const DEFAULT_CHARACTER_SOURCE = 'vndb'

/**
 * 注册「同步游戏角色信息」工具：
 * 按游戏名称 / vndb_id 匹配本地游戏 → 选定角色数据源与外部 ID（必要时写入绑定）→ 同步角色并写库。
 * 预期内的失败（缺参、匹配失败、未绑定数据源等）以结构化结果返回，便于模型向用户追问后重试。
 */
export const useSyncCharactersTool = () => {
  const queryClient = useQueryClient()
  const router = useRouter()

  useWebMCP({
    name: SYNC_CHARACTERS_TOOL_NAME,
    description:
      '同步指定游戏的角色信息（角色卡片与图片）。game 传游戏名称或 vndb_id，工具会自动在游戏库中匹配（匹配到多个会返回候选列表）。角色数据源默认取该游戏已绑定的数据源，也可用 source 指定（如 vndb、bangumi、ymgal）；若未绑定但提供了 externalId，则按 vndb 处理。若游戏没有绑定该数据源的游戏 ID，则必须由用户提供 externalId（如 vndb 的 v184、bangumi 的 subject/12345）——此时工具返回 reason=need-source / need-external-id，请据此向用户询问后再调用。',
    inputSchema: syncCharactersToolInputSchema,
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

      // 2. 选定角色数据源
      const providers = getEnabledCharacterProviders()
      if (providers.length === 0) {
        const message = '当前没有启用任何角色数据源插件，请先在插件设置中启用'
        toast.error(message)
        return { synced: false, reason: 'no-provider', message }
      }

      const gameDetail = await getGameById(String(target.id))
      const bindings = parseExternalSourceIds(gameDetail?.externalSourceIds ?? '')

      const requestedSource = (input.source ?? '').trim()
      const requestedExternalId = (input.externalId ?? '').trim()

      const boundProvider = providers.find((provider) =>
        findExternalSourceBinding(bindings, provider.sourceId),
      )

      // 未指定 source 时：优先复用已绑定的数据源；若用户直接给了 externalId，则按默认数据源（vndb）处理
      const selectedProvider = requestedSource
        ? providers.find((provider) => provider.sourceId === requestedSource)
        : (boundProvider ??
          (requestedExternalId
            ? (providers.find((provider) => provider.sourceId === DEFAULT_CHARACTER_SOURCE) ??
              providers[0])
            : undefined))

      if (requestedSource && !selectedProvider) {
        const available = providers.map((provider) => `${provider.sourceId}（${provider.name}）`)
        const message = `不支持的角色数据源「${requestedSource}」，可选：${available.join('、')}`
        toast.error(message)
        return { synced: false, reason: 'unsupported-source', message }
      }

      if (!selectedProvider) {
        const available = providers.map((provider) => `${provider.sourceId}（${provider.name}）`)
        const message = `「${target.title}」没有绑定任何角色数据源，请让用户指定 source，可选：${available.join('、')}`
        toast.error(message)
        return {
          synced: false,
          reason: 'need-source',
          gameId: target.id,
          game: target.title,
          message,
        }
      }

      const provider = selectedProvider

      // 3. 解析该数据源的外部游戏 ID
      const boundExternalId =
        findExternalSourceBinding(bindings, provider.sourceId)?.externalId ?? ''

      let externalId = boundExternalId

      if (requestedExternalId) {
        externalId = provider.normalizeExternalId(requestedExternalId)
        if (!externalId) {
          const message = `「${requestedExternalId}」不是合法的 ${provider.name} 游戏 ID。${provider.description}`
          toast.error(message)
          return {
            synced: false,
            reason: 'invalid-external-id',
            source: provider.sourceId,
            message,
          }
        }
      }

      if (!externalId) {
        const message = `「${target.title}」未绑定 ${provider.name} 游戏 ID，请让用户提供 externalId。${provider.description}`
        toast.error(message)
        return {
          synced: false,
          reason: 'need-external-id',
          gameId: target.id,
          game: target.title,
          source: provider.sourceId,
          message,
        }
      }

      // 4. 绑定缺失或与现有绑定不一致时，先写入 externalSourceIds（其余数据源绑定保持不变）
      if (externalId !== boundExternalId) {
        const nextBindings = [
          ...withoutExternalSourceBinding(bindings, provider.sourceId),
          { provider: provider.sourceId, externalId },
        ]
        await updateGameInfoById(target.id, {
          externalSourceIds: serializeExternalSourceIds(nextBindings),
        })
      }

      // 5. 同步角色
      const saveImagesToLocal = input.saveImagesToLocal === true
      const result = await syncVndbCharactersByGameId(target.id, {
        source: provider.sourceId,
        saveImagesToLocal,
      })

      await queryClient.invalidateQueries({ queryKey: ['game', String(target.id)] })
      await queryClient.invalidateQueries({ queryKey: ['game'] })
      await queryClient.invalidateQueries({ queryKey: ['game-characters', target.id] })
      await queryClient.invalidateQueries({ queryKey: ['game-cards'] })
      await queryClient.invalidateQueries({ queryKey: ['game-sidebar'] })
      router.refresh()

      // 未绑定或绑定无效时服务端会静默返回 0 条，这里显式提示以免误判为成功
      if (result.total === 0) {
        const message = `「${target.title}」在 ${provider.name} 中没有取到角色数据，请确认绑定的游戏 ID（${externalId}）是否正确`
        toast.warning(message)
        return {
          synced: false,
          reason: 'no-characters',
          gameId: target.id,
          game: target.title,
          source: provider.sourceId,
          externalId,
          message,
        }
      }

      const summary = {
        synced: true,
        gameId: target.id,
        game: target.title,
        source: provider.sourceId,
        sourceName: provider.name,
        externalId,
        total: result.total,
        inserted: result.inserted,
        updated: result.updated,
        saveImagesToLocal,
      }

      toast.success(
        `已同步「${target.title}」的 ${result.total} 个角色（新增 ${result.inserted} / 更新 ${result.updated}）`,
      )

      return summary
    },
  })
}
