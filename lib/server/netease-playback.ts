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
