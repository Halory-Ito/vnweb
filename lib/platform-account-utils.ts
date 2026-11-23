import { api } from '@/lib/request-utils'
import { readPlatformCache, writePlatformCache } from '@/lib/settings/platform-cache'

export type ThirdPartyAccountItem = {
  id: number
  provider: string
  accountId: string
  username: string
  avatar: string
  expiresAt: string
  updatedAt: string | null
  profile?: {
    displayName: string
    secondaryName: string
    avatar: string
    profileUrl: string
  }
}

export const bindThirdPartyAccount = async (payload: {
  provider: 'steam' | 'bangumi' | 'vndb' | 'ymgal'
  accessToken?: string
  accountId?: string
}) => {
  const response = await api.post('/settings/cloud-sync/accounts', payload)
  writePlatformCache('accounts', null)
  return (
    response.data as {
      data: {
        provider: string
        accountId: string
        username: string
        avatar: string
        updatedAt: string
      }
    }
  ).data
}

export const getThirdPartyAccounts = () =>
  readPlatformCache('accounts', async () => {
    const response = await api.get<{ data: { items: ThirdPartyAccountItem[] } }>(
      '/settings/cloud-sync/accounts',
    )
    return response.data.data
  })

export const unlinkThirdPartyAccount = async (provider: 'steam' | 'bangumi' | 'vndb' | 'ymgal') => {
  const response = await api.delete('/settings/cloud-sync/accounts', {
    params: { provider },
  })
  writePlatformCache('accounts', null)
  return (response.data as { data: { deleted: boolean; provider: string } }).data
}

export const syncSteamPlaytime = async () => {
  const response = await api.post('/settings/cloud-sync/steam/sync-playtime')
  return (response.data as { data: { success: boolean; message?: string } }).data
}

export async function checkVndbTokenPermissions() {
  const response = await api.request<{ status: 'unbound' | 'invalid' | 'writable' | 'read-only' }>({
    method: 'GET',
    url: '/settings/cloud-sync/vndb/permissions',
  })
  return response.data.status
}
