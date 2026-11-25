import { readPlatformCache, writePlatformCache } from './platform-cache'
import { api } from '@/lib/request-utils'

import type { EnhancedQuality } from './enhanced-quality'

export type PlatformKey =
  | 'steam'
  | 'bangumi'
  | 'vndb'
  | 'ymgal'
  | 'steamgriddb'
  | 'igdb'
  | 'rawg'
  | 'thegamesdb'
  | 'giantbomb'
  | 'yandere'
  | 'konachan'
  | 'safebooru'
  | 'danbooru'
  | 'gelbooru'
  | 'wallhaven'
  | 'meting'
  | 'enhanced'

export type PlatformSettingsDTO = {
  steam: {
    apiKey: string
  }
  bangumi: {
    useMirror: boolean
    mirrorUrl: string
    baseUrl: string
    tokenUrl: string
  }
  vndb: {
    baseUrl: string
    oauthToken: string
    oauthClientId: string
    oauthClientSecret: string
    oauthAuthorizeUrl: string
    oauthTokenUrl: string
    oauthUserInfoUrl: string
    oauthScope: string
  }
  ymgal: {
    baseUrl: string
    clientId: string
    clientSecret: string
    oauthClientId: string
    oauthClientSecret: string
  }
  steamgriddb: {
    apiKey: string
    baseUrl: string
  }
  igdb: {
    clientId: string
    clientSecret: string
    baseUrl: string
  }
  rawg: {
    apiKey: string
    baseUrl: string
  }
  thegamesdb: {
    apiKey: string
    baseUrl: string
  }
  giantbomb: {
    apiKey: string
    baseUrl: string
  }
  yandere: {
    baseUrl: string
    allowNsfw: boolean
  }
  konachan: {
    baseUrl: string
    allowNsfw: boolean
  }
  safebooru: {
    baseUrl: string
  }
  danbooru: {
    username: string
    apiKey: string
    baseUrl: string
    allowNsfw: boolean
  }
  gelbooru: {
    userId: string
    apiKey: string
    baseUrl: string
    allowNsfw: boolean
  }
  wallhaven: {
    apiKey: string
    baseUrl: string
    allowNsfw: boolean
  }
  meting: {
    bitrate: number
    coverSize: number
    neteaseCookie: string
  }
  enhanced: {
    useLocalSdk: boolean
    apiBase: string
    musicU: string
    quality: EnhancedQuality
    sdkPort: number
  }
}

const REQUIRED_PLATFORM_KEYS: readonly PlatformKey[] = [
  'steam',
  'bangumi',
  'vndb',
  'ymgal',
  'steamgriddb',
  'igdb',
  'rawg',
  'thegamesdb',
  'giantbomb',
  'yandere',
  'konachan',
  'safebooru',
  'danbooru',
  'gelbooru',
  'wallhaven',
  'meting',
  'enhanced',
]

function hasAllPlatformKeys(value: unknown): value is PlatformSettingsDTO {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return REQUIRED_PLATFORM_KEYS.every(
    (key) => record[key] && typeof record[key] === 'object' && !Array.isArray(record[key]),
  )
}

export async function getPlatformSettingsApi(): Promise<PlatformSettingsDTO> {
  const cached = await readPlatformCache('config', async () => {
    const response = await api.request<{ data: PlatformSettingsDTO }>({
      method: 'GET',
      url: '/settings/platform',
    })
    return response.data.data
  })
  if (hasAllPlatformKeys(cached)) return cached

  const response = await api.request<{ data: PlatformSettingsDTO }>({
    method: 'GET',
    url: '/settings/platform',
  })
  writePlatformCache('config', response.data.data)
  return response.data.data
}

export async function updatePlatformSettingsApi<K extends PlatformKey>(
  platform: K,
  config: Partial<PlatformSettingsDTO[K]>,
): Promise<PlatformSettingsDTO> {
  const response = await api.request<{ data: PlatformSettingsDTO }>({
    method: 'PATCH',
    url: '/settings/platform',
    data: { platform, config },
  })
  writePlatformCache('config', response.data.data)
  return response.data.data
}

export type NeteaseSdkStatusDTO = {
  installed: boolean
  version: string | null
  running: boolean
  port: number
  pid: number | null
  endpoint: string
  lastError: string | null
}

export type NeteaseSdkAction = 'install' | 'uninstall' | 'start' | 'stop'

export async function getNeteaseSdkStatusApi(): Promise<NeteaseSdkStatusDTO> {
  const response = await api.request<{ data: NeteaseSdkStatusDTO }>({
    method: 'GET',
    url: '/settings/platform/netease-sdk',
  })
  return response.data.data
}

export async function runNeteaseSdkActionApi(payload: {
  action: NeteaseSdkAction
  port?: number
}): Promise<NeteaseSdkStatusDTO> {
  const response = await api.request<{ data: NeteaseSdkStatusDTO }>({
    method: 'POST',
    url: '/settings/platform/netease-sdk',
    data: payload,
    timeout: payload.action === 'install' ? 200_000 : 30_000,
  })
  if (payload.action === 'start') writePlatformCache('config', null)
  return response.data.data
}
