import { api } from '@/lib/request-utils'

import type { RecentVisitItem, RecentVisitType } from '@/types'

export const getRecentVisits = async (params?: { includeNsfw?: boolean; limit?: number }) => {
  const response = await api.get('/recent-visit', {
    params: {
      includeNsfw: params?.includeNsfw ?? true,
      limit: params?.limit ?? undefined,
    },
  })
  return (response.data as { data: { items: RecentVisitItem[] } }).data
}

export const recordRecentVisit = async (payload: {
  gameId: number
  type: RecentVisitType
  href: string
}) => {
  const response = await api.post('/recent-visit', payload)
  return response.data
}

export const clearRecentVisits = async () => {
  const response = await api.delete('/recent-visit')
  return response.data
}
