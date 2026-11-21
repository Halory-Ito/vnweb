import { api } from '@/lib/request-utils'

export async function getLocalFontDisplayName(filename: string) {
  const response = await api.request<{ data: { name: string | null } }>({
    method: 'get',
    url: '/settings/font/name',
    params: { file: filename },
  })
  return response.data.data.name
}
