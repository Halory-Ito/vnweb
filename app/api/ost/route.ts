import { and, desc, eq, like, or } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs'
import path from 'node:path'

import { NETEASE_API_BASE } from '@/app/config'
import { GameInfoTable, GameOstTable, GameOstSongsTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

const normalizeText = (value: unknown) => {
  if (typeof value !== 'string') {
    return ''
  }
  return value.trim()
}

const parsePositiveNumber = (value: string | null) => {
  if (!value) {
    return null
  }

  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null
  }

  return parsed
}

const getOstList = async (req: NextRequest) => {
  try {
    const keyword = normalizeText(req.nextUrl.searchParams.get('keyword'))
    const gameId = parsePositiveNumber(req.nextUrl.searchParams.get('gameId'))

    const conditions = []

    if (gameId) {
      conditions.push(eq(GameOstTable.gameId, gameId))
    }

    if (keyword) {
      const keywordPattern = `%${keyword}%`
      conditions.push(
        or(
          like(GameOstTable.name, keywordPattern),
          like(GameOstTable.cover, keywordPattern),
          like(GameInfoTable.name, keywordPattern),
          like(GameInfoTable.nameCn, keywordPattern),
        ),
      )
    }

    const rows = await db
      .select({
        id: GameOstTable.id,
        gameId: GameOstTable.gameId,
        name: GameOstTable.name,
        cover: GameOstTable.cover,
        resource: GameOstTable.resource,
        createdAt: GameOstTable.createdAt,
        updatedAt: GameOstTable.updatedAt,
        gameName: GameInfoTable.name,
        gameNameCn: GameInfoTable.nameCn,
        gameCover: GameInfoTable.cover,
        gameBg: GameInfoTable.bg,
      })
      .from(GameOstTable)
      .innerJoin(GameInfoTable, eq(GameOstTable.gameId, GameInfoTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(GameOstTable.id))

    return NextResponse.json({
      data: {
        items: rows,
      },
    })
  } catch (error) {
    console.error('Get ost list failed:', error)
    return NextResponse.json(
      { error: 'Failed to get ost list' },
      { status: 500 },
    )
  }
}

// 根据URL获取文件后缀
const getExtensionFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const lastDot = pathname.lastIndexOf('.')
    if (lastDot > 0 && lastDot < pathname.length - 1) {
      return pathname.slice(lastDot + 1).toLowerCase()
    }
  } catch {
    // ignore
  }
  return 'png' // 默认 png
}

// 下载封面到本地并返回本地路径
const downloadCoverToLocal = async (
  coverUrl: string,
  ostId: number,
  ostName: string,
): Promise<string | null> => {
  try {
    const assetsDir = path.join(process.cwd(), 'public', 'assets', 'ost')
    const ostDir = path.join(assetsDir, String(ostId))

    if (!fs.existsSync(ostDir)) {
      fs.mkdirSync(ostDir, { recursive: true })
    }

    // 生成文件名，根据URL获取后缀
    const extension = getExtensionFromUrl(coverUrl)
    const sanitizedName = ostName.replace(/[/\\?%*:|"<>]/g, '-')
    const fileName = `${sanitizedName}.${extension}`
    const localPath = `/assets/ost/${ostId}/${fileName}`
    const fullPath = path.join(ostDir, fileName)

    // 下载图片
    const response = await fetch(coverUrl)
    if (!response.ok) {
      console.error('Failed to download cover:', response.statusText)
      return null
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 保存到本地
    fs.writeFileSync(fullPath, buffer)

    return localPath
  } catch (error) {
    console.error('Download cover failed:', error)
    return null
  }
}

const createOst = async (req: NextRequest) => {
  try {
    const payload = (await req.json().catch(() => ({}))) as {
      gameId?: number
      name?: string
      cover?: string
      resource?: string
      songs?: Array<{
        name: string
        url: string
        mediaType?: string
        lyricsText?: string
        lyricsPath?: string
      }>
    }

    const gameId = Number(payload.gameId)
    const name = normalizeText(payload.name)
    const cover = normalizeText(payload.cover)
    const resource = normalizeText(payload.resource || 'khinsider')

    if (!Number.isInteger(gameId) || gameId <= 0) {
      return NextResponse.json({ error: '无效的游戏 id' }, { status: 400 })
    }

    if (!name || !cover) {
      return NextResponse.json(
        { error: '游戏、OST名称和封面不能为空' },
        { status: 400 },
      )
    }

    const game = await db
      .select({ id: GameInfoTable.id })
      .from(GameInfoTable)
      .where(eq(GameInfoTable.id, gameId))
      .limit(1)

    if (!game[0]) {
      return NextResponse.json({ error: '游戏不存在' }, { status: 404 })
    }

    const now = new Date().toISOString()
    const inserted = await db
      .insert(GameOstTable)
      .values({
        gameId,
        name,
        cover,
        resource,
        createdAt: now,
        updatedAt: now,
      })
      .returning({
        id: GameOstTable.id,
        gameId: GameOstTable.gameId,
        name: GameOstTable.name,
        cover: GameOstTable.cover,
        resource: GameOstTable.resource,
        createdAt: GameOstTable.createdAt,
        updatedAt: GameOstTable.updatedAt,
      })

    const ostId = inserted[0].id

    // 如果有歌曲列表，则同时保存到 game_ost_songs 表
    if (payload.songs && payload.songs.length > 0) {
      const songValues = await Promise.all(
        payload.songs.map(async (song) => {
          let lyricsText = normalizeText(song.lyricsText || '')

          // 如果是网易云资源且没有提供 lyricsText，则从歌词服务获取
          if (
            resource === 'netease' &&
            !lyricsText &&
            song.url.includes('?id=')
          ) {
            const match = song.url.match(/[?&]id=(\d+)/)
            if (match) {
              const songId = match[1]
              try {
                const lyricResponse = await fetch(
                  `${NETEASE_API_BASE}/lyric?id=${songId}`,
                )
                if (lyricResponse.ok) {
                  const lyricData = await lyricResponse.json()
                  if (lyricData.lrc?.lyric) {
                    lyricsText = lyricData.lrc.lyric
                  }
                }
              } catch (err) {
                console.error('Failed to fetch lyric for song:', song.name, err)
              }
            }
          }

          return {
            gameId,
            ostId,
            name: normalizeText(song.name),
            url: normalizeText(song.url),
            mediaType: normalizeText(song.mediaType || ''),
            lyricsText,
            lyricsPath: '',
            createdAt: now,
            updatedAt: now,
          }
        }),
      )

      await db.insert(GameOstSongsTable).values(songValues)
    }

    return NextResponse.json({
      data: {
        item: inserted[0],
      },
    })
  } catch (error) {
    console.error('Create ost failed:', error)
    return NextResponse.json({ error: 'Failed to create ost' }, { status: 500 })
  }
}

const deleteOst = async (req: NextRequest) => {
  try {
    // 支持查询参数和路径参数两种方式
    const ostId =
      parsePositiveNumber(req.nextUrl.searchParams.get('id')) ||
      parsePositiveNumber(req.nextUrl.searchParams.get('ostId'))

    if (!ostId) {
      return NextResponse.json(
        { error: 'Missing or invalid id parameter' },
        { status: 400 },
      )
    }

    // 检查 OST 是否存在
    const existing = await db
      .select({ id: GameOstTable.id })
      .from(GameOstTable)
      .where(eq(GameOstTable.id, ostId))
      .limit(1)

    if (!existing[0]) {
      return NextResponse.json({ error: 'OST 不存在' }, { status: 404 })
    }

    // 删除关联的歌曲记录
    await db.delete(GameOstSongsTable).where(eq(GameOstSongsTable.ostId, ostId))

    // 删除 OST 记录
    await db.delete(GameOstTable).where(eq(GameOstTable.id, ostId))

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.error('Delete ost failed:', error)
    return NextResponse.json({ error: 'Failed to delete ost' }, { status: 500 })
  }
}

// 后台检查并下载所有OST封面到本地
const syncCoverToLocal = async () => {
  try {
    // 获取所有OST
    const allOst = await db
      .select({
        id: GameOstTable.id,
        name: GameOstTable.name,
        cover: GameOstTable.cover,
      })
      .from(GameOstTable)

    for (const ost of allOst) {
      // 检查是否是网络链接（本地链接不需要处理）
      if (!ost.cover || !ost.cover.startsWith('http')) {
        continue
      }

      // 检查本地文件是否已存在
      const extension = getExtensionFromUrl(ost.cover)
      const sanitizedName = ost.name.replace(/[/\\?%*:|"<>]/g, '-')
      const localPath = `/assets/ost/${ost.id}/${sanitizedName}.${extension}`
      const fullPath = path.join(process.cwd(), 'public', localPath)

      if (fs.existsSync(fullPath)) {
        // 文件已存在，更新数据库路径
        const now = new Date().toISOString()
        await db
          .update(GameOstTable)
          .set({ cover: localPath, updatedAt: now })
          .where(eq(GameOstTable.id, ost.id))
      } else {
        // 文件不存在，下载并保存
        const downloadedPath = await downloadCoverToLocal(
          ost.cover,
          ost.id,
          ost.name,
        )
        if (downloadedPath) {
          const now = new Date().toISOString()
          await db
            .update(GameOstTable)
            .set({ cover: downloadedPath, updatedAt: now })
            .where(eq(GameOstTable.id, ost.id))
        }
      }
    }

    return NextResponse.json({ data: { synced: true } })
  } catch (error) {
    console.error('Sync cover failed:', error)
    return NextResponse.json(
      { error: 'Failed to sync covers' },
      { status: 500 },
    )
  }
}

export {
  getOstList as GET,
  createOst as POST,
  deleteOst as DELETE,
  syncCoverToLocal as PATCH,
}
