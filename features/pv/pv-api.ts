import { api } from '@/lib/request-utils'

import type { AxiosProgressEvent } from 'axios'

export async function uploadPvVideo(
  file: File,
  gameId: string,
  onUploadProgress: (event: AxiosProgressEvent) => void,
) {
  const data = new FormData()
  data.append('file', file)
  data.append('gameId', gameId)

  const response = await api.request<{ data: { url: string } }>({
    method: 'POST',
    url: '/pv/upload',
    data,
    onUploadProgress,
  })
  return response.data.data.url
}
