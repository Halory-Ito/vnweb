import { resolveGameIdApi } from '@/api'

import type { GameResolveItem } from '@/types'

export type ResolveTargetGameResult =
  | { ok: true; game: GameResolveItem }
  | { ok: false; reason: 'game-not-found' | 'multiple-matches'; message: string }

/**
 * 在本地游戏库中按名称 / vndb_id 定位目标游戏。
 * 0 个或多个匹配都返回可读原因，交给模型向用户追问后重试——WebMCP 工具共用这一段。
 */
export const resolveTargetGame = async (keyword: string): Promise<ResolveTargetGameResult> => {
  const candidates = await resolveGameIdApi(keyword)

  if (candidates.length === 0) {
    return {
      ok: false,
      reason: 'game-not-found',
      message: `游戏库中未找到「${keyword}」，请确认游戏名称或 vndb_id 是否正确，或先把该游戏添加到游戏库`,
    }
  }

  if (candidates.length > 1) {
    const list = candidates
      .slice(0, 5)
      .map((item, index) => `${index + 1}. ${item.title}（id ${item.id}）`)
      .join('；')
    return {
      ok: false,
      reason: 'multiple-matches',
      message: `「${keyword}」匹配到多个游戏，请用更精确的名称或 vndb_id 重新指定：${list}`,
    }
  }

  return { ok: true, game: candidates[0] }
}
