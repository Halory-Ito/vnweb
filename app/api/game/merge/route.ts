import { eq, inArray } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import {
  CharacterTable,
  GameIdMapTable,
  GameInfoTable,
  GameMemoryTable,
  GameOstSongsTable,
  GameOstTable,
  GamePlayTable,
  GamePvTable,
  GameQuoteTable,
  GameRecordTable,
  relateWebsiteTable,
} from '@/db/schema'
import { db } from '@/lib/drizzle'

// 合并 CSV 字段（去重）
function mergeCsvFields(...values: (string | null | undefined)[]): string {
  const set = new Set<string>()
  for (const value of values) {
    if (value) {
      for (const item of value.split(',')) {
        const trimmed = item.trim()
        if (trimmed) {
          set.add(trimmed)
        }
      }
    }
  }
  return Array.from(set).join(',')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sourceIds, targetId } = body as {
      sourceIds: string[]
      targetId: string
    }

    if (!Array.isArray(sourceIds) || sourceIds.length === 0) {
      return NextResponse.json(
        { error: '请选择至少一个源游戏' },
        { status: 400 },
      )
    }

    if (!targetId) {
      return NextResponse.json({ error: '请选择目标游戏' }, { status: 400 })
    }

    const numericTargetId = Number(targetId)
    const numericSourceIds = sourceIds
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0)

    if (!Number.isInteger(numericTargetId) || numericTargetId <= 0) {
      return NextResponse.json({ error: '无效的目标游戏 ID' }, { status: 400 })
    }

    if (numericSourceIds.includes(numericTargetId)) {
      return NextResponse.json(
        { error: '源游戏不能包含目标游戏' },
        { status: 400 },
      )
    }

    // 获取目标游戏信息
    const targetGame = await db
      .select()
      .from(GameInfoTable)
      .where(eq(GameInfoTable.id, numericTargetId))
      .limit(1)

    if (!targetGame[0]) {
      return NextResponse.json({ error: '目标游戏不存在' }, { status: 404 })
    }

    // 获取源游戏信息
    const sourceGames = await db
      .select()
      .from(GameInfoTable)
      .where(inArray(GameInfoTable.id, numericSourceIds))

    if (sourceGames.length === 0) {
      return NextResponse.json({ error: '源游戏不存在' }, { status: 404 })
    }

    // 合并游戏信息
    const target = targetGame[0]
    const mergedTags = mergeCsvFields(
      target.tags,
      ...sourceGames.map((g) => g.tags),
    )
    const mergedAliases = mergeCsvFields(
      target.ailases,
      ...sourceGames.map((g) => g.ailases),
    )
    const mergedPlatforms = mergeCsvFields(
      target.platforms,
      ...sourceGames.map((g) => g.platforms),
    )

    // 更新目标游戏信息
    await db
      .update(GameInfoTable)
      .set({
        tags: mergedTags,
        ailases: mergedAliases,
        platforms: mergedPlatforms,
        // 如果目标游戏缺少某些字段，从源游戏中补充
        summary: target.summary || sourceGames.find((g) => g.summary)?.summary,
        cover: target.cover || sourceGames.find((g) => g.cover)?.cover,
        bg: target.bg || sourceGames.find((g) => g.bg)?.bg,
        icon: target.icon || sourceGames.find((g) => g.icon)?.icon,
        logo: target.logo || sourceGames.find((g) => g.logo)?.logo,
        developer:
          target.developer || sourceGames.find((g) => g.developer)?.developer,
        publisher:
          target.publisher || sourceGames.find((g) => g.publisher)?.publisher,
        gameType:
          target.gameType || sourceGames.find((g) => g.gameType)?.gameType,
        gameEngine:
          target.gameEngine ||
          sourceGames.find((g) => g.gameEngine)?.gameEngine,
      })
      .where(eq(GameInfoTable.id, numericTargetId))

    // 迁移关联数据
    for (const sourceId of numericSourceIds) {
      // 迁移外部 ID 映射
      await db
        .update(GameIdMapTable)
        .set({ gameId: numericTargetId })
        .where(eq(GameIdMapTable.gameId, sourceId))

      // 迁移角色
      await db
        .update(CharacterTable)
        .set({ gameId: numericTargetId })
        .where(eq(CharacterTable.gameId, sourceId))

      // 迁移 PV
      await db
        .update(GamePvTable)
        .set({ gameId: numericTargetId })
        .where(eq(GamePvTable.gameId, sourceId))

      // 迁移 OST
      await db
        .update(GameOstTable)
        .set({ gameId: numericTargetId })
        .where(eq(GameOstTable.gameId, sourceId))

      // 迁移 OST 歌曲
      await db
        .update(GameOstSongsTable)
        .set({ gameId: numericTargetId })
        .where(eq(GameOstSongsTable.gameId, sourceId))

      // 迁移游戏记录
      await db
        .update(GameRecordTable)
        .set({ gameId: numericTargetId })
        .where(eq(GameRecordTable.gameId, sourceId))

      // 迁移游戏回忆
      await db
        .update(GameMemoryTable)
        .set({ gameId: numericTargetId })
        .where(eq(GameMemoryTable.gameId, sourceId))

      // 迁移游戏台词
      await db
        .update(GameQuoteTable)
        .set({ gameId: numericTargetId })
        .where(eq(GameQuoteTable.gameId, sourceId))

      // 迁移关联网站
      await db
        .update(relateWebsiteTable)
        .set({ gameId: numericTargetId })
        .where(eq(relateWebsiteTable.gameId, sourceId))

      // 合并游戏时间（累加到目标游戏）
      const sourcePlay = await db
        .select()
        .from(GamePlayTable)
        .where(eq(GamePlayTable.gameId, sourceId))
        .limit(1)

      if (sourcePlay[0]) {
        const targetPlay = await db
          .select()
          .from(GamePlayTable)
          .where(eq(GamePlayTable.gameId, numericTargetId))
          .limit(1)

        if (targetPlay[0]) {
          // 累加游戏时间
          await db
            .update(GamePlayTable)
            .set({
              totalPlayTime:
                (targetPlay[0].totalPlayTime || 0) +
                (sourcePlay[0].totalPlayTime || 0),
              playCount:
                (targetPlay[0].playCount || 0) + (sourcePlay[0].playCount || 0),
            })
            .where(eq(GamePlayTable.id, targetPlay[0].id))
        } else {
          // 如果目标游戏没有 play 记录，迁移源游戏的
          await db
            .update(GamePlayTable)
            .set({ gameId: numericTargetId })
            .where(eq(GamePlayTable.id, sourcePlay[0].id))
        }
      }

      // 删除源游戏
      await db.delete(GameInfoTable).where(eq(GameInfoTable.id, sourceId))
    }

    return NextResponse.json({
      data: {
        success: true,
        mergedCount: numericSourceIds.length,
        targetId: numericTargetId,
      },
    })
  } catch (error) {
    console.error('Merge games failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '合并游戏失败' },
      { status: 500 },
    )
  }
}
