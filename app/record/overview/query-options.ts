import { api } from '@/lib/request-utils'
import { RecordOverviewStats } from '@/types/record-types'

export const fetchOverviewStatsApi = async (): Promise<RecordOverviewStats> => {
  const res = await api.request({
    method: 'GET',
    url: '/record/overview/stats',
  })

  if (!res.status || res.status >= 400) {
    throw new Error(`Failed to fetch overview stats: ${res.status}`)
  }

  return res.data.data
}
