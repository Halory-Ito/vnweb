import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { CharacterTable } from '@/db/schema'
import { db } from '@/lib/drizzle'
import { localizeCharacterImage } from '@/lib/providers/characters/utils'

const isRemoteUrl = (value: string) => /^https?:\/\//i.test(value)

const localizeCharacterImages = async (req: NextRequest) => {
  try {
    const payload = (await req.json().catch(() => ({}))) as {
      gameId?: number
    }

    const gameId = Number(payload.gameId)

    if (!Number.isInteger(gameId) || gameId <= 0) {
      return NextResponse.json({ error: '无效的游戏 id' }, { status: 400 })
    }

    // 获取所有角色
    const characters = await db
      .select({
        id: CharacterTable.id,
        vndbId: CharacterTable.vndbId,
        imageUrl: CharacterTable.imageUrl,
      })
      .from(CharacterTable)
      .where(eq(CharacterTable.gameId, gameId))

    if (!characters.length) {
      return NextResponse.json({
        data: {
          total: 0,
          localized: 0,
          skipped: 0,
          failed: 0,
        },
      })
    }

    let localized = 0
    let skipped = 0
    let failed = 0

    // 逐个检查并本地化图片
    for (const character of characters) {
      // 如果已经是本地路径，跳过
      if (!character.imageUrl || !isRemoteUrl(character.imageUrl)) {
        skipped++
        continue
      }

      try {
        const localPath = await localizeCharacterImage(
          gameId,
          character.vndbId,
          character.imageUrl,
        )

        // 更新数据库中的图片路径
        await db
          .update(CharacterTable)
          .set({ imageUrl: localPath })
          .where(eq(CharacterTable.id, character.id))

        localized++
      } catch (error) {
        console.error(
          `Failed to localize image for character ${character.vndbId}:`,
          error,
        )
        failed++
      }
    }

    return NextResponse.json({
      data: {
        total: characters.length,
        localized,
        skipped,
        failed,
      },
    })
  } catch (error) {
    console.error('Localize character images failed:', error)
    return NextResponse.json(
      { error: 'Failed to localize character images' },
      { status: 500 },
    )
  }
}

export { localizeCharacterImages as POST }
