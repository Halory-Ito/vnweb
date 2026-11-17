import { NextRequest, NextResponse } from 'next/server'

import { METING_SERVERS, METING_TYPES } from '@/features/ost/meting-types'
import { metingDetails, requestMeting, isHttpUrl } from '@/lib/server/meting'

import type { MetingInput } from '@/features/ost/meting-types'

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const server = params.get('server') || 'netease'
  const type = params.get('type') || 'album'
  const id = params.get('id')?.trim() || ''
  if (
    !Object.hasOwn(METING_SERVERS, server) ||
    (type !== 'search' && !Object.hasOwn(METING_TYPES, type)) ||
    (type === 'search' ? !id || id.length > 200 : !/^\d{1,30}$/.test(id))
  )
    return NextResponse.json(
      { error: '请选择有效的平台、类型并输入关键词或数字 ID' },
      { status: 400 },
    )
  const input = { server, type, id } as MetingInput
  try {
    const songs = await requestMeting(input)
    if (type === 'search') {
      const items = songs.map((song) => {
        const songId = new URL(song.url).searchParams.get('id')
        if (!songId || !/^\d{1,30}$/.test(songId)) throw new Error('Missing Meting song ID')
        return {
          source: 'meting-api',
          id: `${server}:song:${songId}`,
          name: song.title || song.name,
          artist: Array.isArray(song.artist) ? song.artist.join(' / ') : song.artist || song.author,
          cover: isHttpUrl(song.pic) ? song.pic : '',
          url: song.url,
          type: 'song',
          songCount: 1,
        }
      })
      return NextResponse.json({ data: items })
    }
    if (!songs.length)
      return NextResponse.json({ error: '没有找到歌曲，请检查平台、类型和 ID' }, { status: 404 })
    return NextResponse.json({ data: metingDetails(input, songs) })
  } catch (error) {
    console.error('Meting request failed:', error)
    return NextResponse.json({ error: 'Meting API 暂时不可用，请稍后重试' }, { status: 502 })
  }
}
