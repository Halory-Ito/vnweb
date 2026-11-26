import { randomUUID } from 'node:crypto'

import { readMetingMedia } from './meting'
import { readPlatformSettings, resolveEnhancedApiBase } from './platform-settings'
import { api } from '@/lib/request-utils'

export async function getNeteaseEnhancedService() {
  const { enhanced } = await readPlatformSettings()
  const apiBase = resolveEnhancedApiBase(enhanced)
  if (new URL(apiBase).hostname === 'music.163.com') return null
  return {
    apiBase,
    cookie: enhanced.musicU ? 'MUSIC_U=' + enhanced.musicU : undefined,
    quality: enhanced.quality,
  }
}

export async function getNeteasePlaybackUrl(id: string, keepStoredUrl = false) {
  const service = await getNeteaseEnhancedService()
  if (keepStoredUrl && !service?.cookie) return undefined
  if (!service) {
    return (await readMetingMedia('netease', 'url', id)) || null
  }

  // The standard bitrate also works on services whose v1 endpoint is unavailable.
  const standard = service.quality === 'standard'
  const { data } = await api.request<{
    data?: Array<{ url?: string | null; freeTrialInfo?: unknown }>
  }>({
    method: 'GET',
    url: service.apiBase + (standard ? '/song/url' : '/song/url/v1'),
    params: {
      id,
      ...(standard ? { br: 128000 } : { level: service.quality }),
      requestId: randomUUID(),
    },
    headers: { Cookie: service.cookie },
    maxRedirects: 0,
    timeout: 20000,
  })
  const song = data.data?.[0]
  if (!song?.url || song.freeTrialInfo) return null
  const { protocol } = new URL(song.url)
  return protocol === 'https:' || protocol === 'http:' ? song.url : null
}

type NeteaseLyricResponse = {
  code?: number
  nolyric?: boolean
  uncollected?: boolean
  lrc?: { lyric?: string }
  tlyric?: { lyric?: string }
  romalrc?: { lyric?: string }
}

function formatNeteaseLyric(data: NeteaseLyricResponse): string {
  return [data.lrc?.lyric, data.romalrc?.lyric, data.tlyric?.lyric]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join('\n')
}

async function requestNeteaseLyric(
  url: string,
  params: Record<string, string | number>,
  headers?: Record<string, string>,
): Promise<string> {
  const { data } = await api.request<NeteaseLyricResponse>({
    method: 'GET',
    url,
    params,
    headers,
    timeout: 20000,
  })
  if (!data || data.code !== 200) {
    throw new Error('网易云歌词接口返回异常')
  }
  return formatNeteaseLyric(data)
}

export async function getNeteaseLyric(id: string): Promise<string> {
  const service = await getNeteaseEnhancedService()
  if (service) {
    try {
      return await requestNeteaseLyric(
        `${service.apiBase}/lyric`,
        { id },
        service.cookie ? { Cookie: service.cookie } : undefined,
      )
    } catch {
      // Enhanced API 获取歌词失败时，回退到网易云公开接口和 Meting
    }
  }

  try {
    return await requestNeteaseLyric(
      'https://music.163.com/api/song/lyric',
      { id, lv: -1, tv: -1, rv: -1 },
      { Referer: 'https://music.163.com/', Accept: 'application/json' },
    )
  } catch {
    return readMetingMedia('netease', 'lyric', id)
  }
}
