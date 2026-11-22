import { api } from '@/lib/request-utils'

import type { YmgalPlatformConfig } from './platform-settings'

let cachedToken:
  | { baseUrl: string; clientId: string; clientSecret: string; value: string; expiresAt: number }
  | undefined

export async function getYmgalClientToken(
  { baseUrl, clientId, clientSecret }: YmgalPlatformConfig,
  postHeaders?: Record<string, string>,
): Promise<string> {
  if (!baseUrl || !clientId || !clientSecret) {
    throw new Error('请在平台设置中配置 YMGal 站点地址、Client ID 和 Client Secret')
  }
  if (
    cachedToken &&
    cachedToken.baseUrl === baseUrl &&
    cachedToken.clientId === clientId &&
    cachedToken.clientSecret === clientSecret &&
    Date.now() < cachedToken.expiresAt
  )
    return cachedToken.value

  const params = {
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'public',
  }
  const url = baseUrl + '/oauth/token'
  const response = await api
    .request<{ access_token?: string; expires_in?: number }>({
      url,
      ...(postHeaders
        ? {
            method: 'POST',
            data: new URLSearchParams(params),
            headers: { ...postHeaders, 'Content-Type': 'application/x-www-form-urlencoded' },
          }
        : { method: 'GET', params }),
    })
    .catch(() => {
      throw new Error('YMGal: 获取 access token 失败')
    })
  const { access_token: value, expires_in: expiresIn } = response.data
  if (!value) throw new Error('YMGal: 获取 access token 失败')

  cachedToken = {
    baseUrl,
    clientId,
    clientSecret,
    value,
    expiresAt: Date.now() + (expiresIn ?? 3600) * 1000 - 60_000,
  }
  return value
}
