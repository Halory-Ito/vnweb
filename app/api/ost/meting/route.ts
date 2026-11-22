import { NextRequest, NextResponse } from 'next/server'

import {
  METING_ID_PATTERN,
  METING_SERVERS,
  METING_TYPES,
  metingMediaPath,
} from '@/features/ost/meting-types'
import { metingDetails, readMetingMedia, requestMeting } from '@/lib/server/meting'

import type { MetingInput, MetingServer } from '@/features/ost/meting-types'

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const server = params.get('server') || 'netease'
  const type = params.get('type') || 'album'
  const id = params.get('id')?.trim() || ''
  const isMedia = type === 'url' || type === 'lyric' || type === 'pic'
  if (
    !Object.hasOwn(METING_SERVERS, server) ||
    (type !== 'search' && !isMedia && !Object.hasOwn(METING_TYPES, type)) ||
    (type === 'search' ? !id || id.length > 200 : !METING_ID_PATTERN.test(id))
  )
    return NextResponse.json({ error: '请选择有效的平台、类型并输入关键词或 ID' }, { status: 400 })
  try {
    if (isMedia) {
      const value = await readMetingMedia(server as MetingServer, type, id)
      if (!value) return new NextResponse(null, { status: 404 })
      if (type === 'lyric') {
        return new NextResponse(value, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
      }
      return NextResponse.redirect(value, { headers: { 'Cache-Control': 'no-store' } })
    }

    const input = { server, type, id } as MetingInput
    const songs = await requestMeting(input)
    if (type === 'search') {
      const items = songs.map((song) => ({
        source: 'meting-api',
        id: server + ':song:' + song.id,
        name: song.name,
        artist: song.artist,
        cover: song.pictureId ? metingMediaPath(input.server, 'pic', song.pictureId) : '',
        url: metingMediaPath(input.server, 'url', song.urlId),
        type: 'song',
        songCount: 1,
      }))
      return NextResponse.json({ data: items })
    }
    if (!songs.length)
      return NextResponse.json({ error: '没有找到歌曲，请检查平台、类型和 ID' }, { status: 404 })
    return NextResponse.json({ data: await metingDetails(input, songs) })
  } catch {
    return NextResponse.json({ error: 'Meting SDK 暂时不可用，请稍后重试' }, { status: 502 })
  }
}
