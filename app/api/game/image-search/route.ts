import { NextRequest, NextResponse } from 'next/server'

import {
  DEFAULT_GAME_IMAGE_SOURCE,
  GAME_IMAGE_TYPE_LABELS,
  isGameImageSource,
  supportsGameImageType,
  type GameImageType,
} from '@/lib/game-image-sources'
import { searchGameImagesFromSource } from '@/lib/server/game-image-search'
import { isPlatformEnabledOnServer } from '@/lib/server/platform-visibility'
import { GAME_IMAGE_TYPE_TO_FEATURE_CATEGORY } from '@/lib/settings/platform-visibility'

type SearchImagePayload = {
  source?: string
  keyword?: string
  imageType?: GameImageType
  includeNsfw?: boolean
}

const VALID_IMAGE_TYPES = new Set<GameImageType>(['cover', 'bg', 'icon', 'logo'])

const searchImages = async (req: NextRequest) => {
  try {
    const payload = (await req.json().catch(() => ({}))) as SearchImagePayload
    const rawSource = (payload.source || DEFAULT_GAME_IMAGE_SOURCE).trim().toLowerCase()
    const keyword = (payload.keyword || '').trim()
    const imageType = VALID_IMAGE_TYPES.has(payload.imageType as GameImageType)
      ? (payload.imageType as GameImageType)
      : 'cover'
    const includeNsfw = typeof payload.includeNsfw === 'boolean' ? payload.includeNsfw : undefined

    if (!keyword) {
      return NextResponse.json({ error: '请输入名称或 id' }, { status: 400 })
    }

    if (!isGameImageSource(rawSource)) {
      return NextResponse.json({ error: `暂不支持的数据源: ${rawSource}` }, { status: 400 })
    }

    if (
      !(await isPlatformEnabledOnServer(rawSource, GAME_IMAGE_TYPE_TO_FEATURE_CATEGORY[imageType]))
    ) {
      return NextResponse.json({ error: '该平台未在「设置 → 平台」中开启' }, { status: 403 })
    }

    if (!supportsGameImageType(rawSource, imageType)) {
      return NextResponse.json(
        { error: `该数据源暂不提供${GAME_IMAGE_TYPE_LABELS[imageType]}资源` },
        { status: 400 },
      )
    }

    const result = await searchGameImagesFromSource({
      source: rawSource,
      keyword,
      imageType,
      includeNsfw,
    })

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('Search game images failed:', error)
    return NextResponse.json({ error: (error as Error).message || '搜索图片失败' }, { status: 500 })
  }
}

export { searchImages as POST }
