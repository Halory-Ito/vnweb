import { NextRequest, NextResponse } from 'next/server'

import { SGDBClient } from '@/lib/vndb-client'

type SearchImagePayload = {
  source?: string
  keyword?: string
  imageType?: 'cover' | 'bg' | 'icon' | 'logo'
}

type SGDBImageItem = {
  id: number
  url: string
  thumb: string
  width: number
  height: number
}

const resolveGameIdByKeyword = async (keyword: string) => {
  const trimmed = keyword.trim()
  if (!trimmed) {
    return null
  }

  if (/^\d+$/.test(trimmed)) {
    return {
      id: Number(trimmed),
      name: `#${trimmed}`,
    }
  }

  const matches = await SGDBClient.searchGame(trimmed)
  if (!matches || matches.length === 0) {
    return null
  }

  return {
    id: matches[0].id,
    name: matches[0].name,
  }
}

const normalizeSGDBImages = (images: unknown[]): SGDBImageItem[] => {
  return images
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null
      }

      const source = item as {
        id?: number
        url?: URL | string
        thumb?: URL | string
        width?: number
        height?: number
      }

      if (typeof source.id !== 'number') {
        return null
      }

      return {
        id: source.id,
        url: String(source.url ?? ''),
        thumb: String(source.thumb ?? ''),
        width: Number(source.width ?? 0),
        height: Number(source.height ?? 0),
      }
    })
    .filter((item): item is SGDBImageItem => item !== null)
}

const searchImages = async (req: NextRequest) => {
  try {
    const payload = (await req.json().catch(() => ({}))) as SearchImagePayload
    const source = (payload.source || 'steamgriddb').trim().toLowerCase()
    const keyword = (payload.keyword || '').trim()
    const imageType = payload.imageType || 'cover'

    if (!keyword) {
      return NextResponse.json({ error: '请输入名称或 id' }, { status: 400 })
    }

    if (source !== 'steamgriddb') {
      return NextResponse.json(
        { error: `暂不支持的数据源: ${source}` },
        { status: 400 },
      )
    }

    const game = await resolveGameIdByKeyword(keyword)
    if (!game) {
      return NextResponse.json({
        data: {
          game: null,
          items: [],
        },
      })
    }

    let images: unknown[] = []

    if (imageType === 'cover') {
      images = await SGDBClient.getGridsById(game.id)
    } else if (imageType === 'bg') {
      images = await SGDBClient.getHeroesById(game.id)
    } else if (imageType === 'icon') {
      images = await SGDBClient.getIconsById(game.id)
    } else {
      images = await SGDBClient.getLogosById(game.id)
    }

    return NextResponse.json({
      data: {
        game,
        items: normalizeSGDBImages(images).slice(0, 30),
      },
    })
  } catch (error) {
    console.error('Search game images failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '搜索图片失败' },
      { status: 500 },
    )
  }
}

export { searchImages as POST }
