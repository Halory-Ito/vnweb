import dayjs from 'dayjs'
import { sql } from 'drizzle-orm'

import { db } from '@/lib/drizzle'

// 已完成 / 多周目视为「已通关」的状态
export const COMPLETED_GAME_STATUSES = [3, 4] as const

export const isCompletedStatus = (status: number) => status === 3 || status === 4

// 表结构兜底：本项目 `drizzle-kit push` 因既有索引冲突无法执行，
// 这里保证 game_play.completedAt 列存在，并用历史数据回填完成时间。
let schemaReady: Promise<void> | null = null

/** 确保 game_play.completedAt 列存在，并回填历史已完成记录的完成时间 */
export function ensureGameCompletionSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const columns = await db.all<{ name?: unknown }>(sql`PRAGMA table_info('game_play')`)
      const hasColumn = columns.some((column) => String(column.name ?? '') === 'completedAt')

      if (!hasColumn) {
        await db.run(sql`ALTER TABLE \`game_play\` ADD COLUMN \`completedAt\` text DEFAULT ''`)
      }

      // 历史已完成 / 多周目记录缺少完成时间时，用最后游玩时间近似回填
      await db.run(sql`
        UPDATE \`game_play\`
        SET \`completedAt\` = \`lastLaunchedAt\`
        WHERE \`status\` IN (3, 4)
          AND (\`completedAt\` IS NULL OR \`completedAt\` = '')
          AND \`lastLaunchedAt\` IS NOT NULL
          AND \`lastLaunchedAt\` <> ''
      `)
    })().catch((error) => {
      schemaReady = null
      throw error
    })
  }

  return schemaReady
}

/** 状态变更时解析完成时间：转入已完成/多周目时保留原时间或记录当前时间，否则清空 */
export function resolveCompletedAt(status: number, previous?: string | null) {
  if (!isCompletedStatus(status)) {
    return ''
  }
  const prev = (previous || '').trim()
  return prev || dayjs().toISOString()
}
