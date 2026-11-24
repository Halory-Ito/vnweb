import { api } from '@/lib/request-utils'

export const BANGUMI_OFFICIAL_API_URL = 'https://api.bgm.tv'
export const BANGUMI_OFFICIAL_BASE_URL = 'https://bgm.tv'
export const BANGUMI_OFFICIAL_TOKEN_URL = 'https://next.bgm.tv/demo/access-token'

export function resolveBangumiTokenUrl(bangumi?: {
  useMirror?: boolean
  tokenUrl?: string
}): string {
  if (bangumi?.useMirror) {
    const custom = bangumi.tokenUrl?.trim().replace(/\/+$/, '')
    if (custom) return custom
  }
  return BANGUMI_OFFICIAL_TOKEN_URL
}

export type BangumiSettingsResponse = {
  mirrorUrl: string
  defaultMirrorUrl: string
}

export async function getBangumiSettingsApi(): Promise<BangumiSettingsResponse> {
  const response = await api.request<{ data: BangumiSettingsResponse }>({
    method: 'GET',
    url: '/settings/platform/bangumi',
  })
  return response.data.data
}

export async function saveBangumiSettingsApi(mirrorUrl: string): Promise<BangumiSettingsResponse> {
  const response = await api.request<{ data: BangumiSettingsResponse }>({
    method: 'POST',
    url: '/settings/platform/bangumi',
    data: { mirrorUrl },
  })
  return response.data.data
}
