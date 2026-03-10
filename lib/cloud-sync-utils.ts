import { api } from '@/lib/request-utils'

export type ThirdPartyAccountItem = {
  id: number
  provider: string
  accountId: string
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
  provider: 'steam' | 'bangumi' | 'vndb'
  accessToken?: string
  accountId?: string
}) => {
  const response = await api.post('/settings/cloud-sync/accounts', payload)
  return (
    response.data as {
      data: {
        provider: string
        accountId: string
        updatedAt: string
      }
    }
  ).data
}

export const getThirdPartyAccounts = async () => {
  const response = await api.get('/settings/cloud-sync/accounts')
  return (
    response.data as {
      data: {
        items: ThirdPartyAccountItem[]
      }
    }
  ).data
}

export const unlinkThirdPartyAccount = async (
  provider: 'steam' | 'bangumi' | 'vndb',
) => {
  const response = await api.delete('/settings/cloud-sync/accounts', {
    params: { provider },
  })
  return (response.data as { data: { deleted: boolean; provider: string } })
    .data
}
