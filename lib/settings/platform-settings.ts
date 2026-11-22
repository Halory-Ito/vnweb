import { api } from '@/lib/request-utils'

import type { EnhancedQuality } from './enhanced-quality'

export type PlatformKey =
  | 'steam'
  | 'bangumi'
  | 'vndb'
  | 'ymgal'
  | 'steamgriddb'
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
    apiKey: string
    oauthClientId: string
    oauthClientSecret: string
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

export async function getPlatformSettingsApi(): Promise<PlatformSettingsDTO> {
  const response = await api.request<{ data: PlatformSettingsDTO }>({
    method: 'GET',
    url: '/settings/platform',
  })
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
  return response.data.data
}
