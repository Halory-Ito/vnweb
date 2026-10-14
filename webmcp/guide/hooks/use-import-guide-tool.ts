'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useWebMCP } from 'usewebmcp'

import { getGuideApi, importGuideApi, validateGuideJson } from '@/features/guide'
import {
  IMPORT_GUIDE_TOOL_NAME,
  importGuideToolInputSchema,
} from '@/webmcp/guide/lib/import-guide-tool-schema'
import { resolveTargetGame } from '@/webmcp/lib'

/** 把 guide 参数（对象或 JSON 字符串）解析为通过校验的攻略数据 */
const parseGuide = (raw: unknown) => {
  let parsed: unknown = raw

  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw)
    } catch {
      throw new Error('guide 不是合法的 JSON 字符串')
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('缺少攻略数据 guide，请按攻略 JSON 结构整理后传入')
  }

  try {
    return validateGuideJson(parsed)
  } catch (error) {
    const issue = (error as { issues?: Array<{ message?: string; path?: Array<string | number> }> })
      .issues?.[0]
    const path = issue?.path?.length ? `${issue.path.join('.')}: ` : ''
    const detail = issue?.message ? `${path}${issue.message}` : (error as Error).message
    throw new Error(`攻略数据不符合格式：${detail}`)
  }
}

const countSteps = (routes: ReturnType<typeof validateGuideJson>['routes']) =>
  routes.reduce(
    (total, route) => total + route.endings.reduce((sum, ending) => sum + ending.steps.length, 0),
    0,
  )

/**
 * 注册「生成并导入游戏攻略」工具：
 * 接收整理好的攻略数据与游戏名称 / vndb_id，匹配本地游戏后写入攻略（已有攻略需 overwrite 覆盖）。
 * 预期内的失败（缺参、格式错误、游戏找不到 / 匹配多个）以结果形式返回，便于模型自我纠正。
 */
export const useImportGuideTool = () => {
  const queryClient = useQueryClient()
  const router = useRouter()

  useWebMCP({
    name: IMPORT_GUIDE_TOOL_NAME,
    description:
      '把攻略资料整理成结构化数据并导入到指定游戏（生成游戏攻略）。调用前请先按攻略 JSON 结构整理用户在对话中上传的攻略文件内容：顶层必须有 name（{"zh-cn": 中文名必填}）与 routes，routes→endings→steps，步骤 type 取 choice/save/load/note，文字保持原文不翻译。game 传游戏名称或 vndb_id，工具会自动在游戏库中匹配（匹配到多个会返回候选列表）。目标游戏已有攻略时会返回提示，需要覆盖请以 overwrite: true 再次调用。',
    inputSchema: importGuideToolInputSchema,
    annotations: { readOnlyHint: false },
    execute: async (input) => {
      const game = (input.game ?? '').trim()
      if (!game) {
        const message = '请提供游戏名称或 vndb_id（game）'
        toast.error(message)
        return { imported: false, reason: 'missing-game', message }
      }

      let guide: ReturnType<typeof validateGuideJson>
      try {
        guide = parseGuide(input.guide)
      } catch (error) {
        const message = (error as Error).message
        toast.error(message)
        return { imported: false, reason: 'invalid-guide', message }
      }

      const matched = await resolveTargetGame(game)
      if (!matched.ok) {
        toast.error(matched.message)
        return { imported: false, reason: matched.reason, message: matched.message }
      }

      const target = matched.game
      const existing = await getGuideApi(target.id)

      if (existing && !input.overwrite) {
        const message = `「${target.title}」已有攻略；确认覆盖请以 overwrite: true 再次调用本工具`
        toast.warning(message)
        return {
          imported: false,
          reason: 'guide-exists',
          gameId: target.id,
          game: target.title,
          message,
        }
      }

      await importGuideApi({
        gameId: target.id,
        guide: { ...guide, cover: target.cover || guide.cover },
        overwrite: Boolean(existing),
      })

      await queryClient.invalidateQueries({ queryKey: ['guide-list'] })
      await queryClient.invalidateQueries({ queryKey: ['guide', target.id] })
      router.refresh()

      const summary = {
        imported: true,
        overwritten: Boolean(existing),
        gameId: target.id,
        game: target.title,
        routes: guide.routes.length,
        endings: guide.routes.reduce((sum, route) => sum + route.endings.length, 0),
        steps: countSteps(guide.routes),
      }

      toast.success(
        `${existing ? '已覆盖' : '已导入'}「${target.title}」的攻略（${summary.routes} 条路线 / ${summary.endings} 个结局 / ${summary.steps} 步）`,
      )

      return summary
    },
  })
}
