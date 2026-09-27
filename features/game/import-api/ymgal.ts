import { api } from '@/lib/request-utils'

import type { ThirdPartyLibraryGameItem } from './types'

export const searchYmgalUserGamesApi = async () => {
  const res = await api.request({
    method: 'GET',
    url: '/game/ymgal-import/search',
    timeout: 10 * 60 * 1000,
  })

  return res.data as {
    data: {
      total: number
      items: ThirdPartyLibraryGameItem[]
    }
  }
}
