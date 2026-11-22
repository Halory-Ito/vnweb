import { api } from '@/lib/request-utils'

export async function getLibraryFolderLogos() {
  const response = await api.request<{ data: Record<string, string> }>({
    method: 'GET',
    url: '/game/library-folder-logos',
  })
  return response.data.data
}

export async function saveLibraryFolderLogo(data: {
  href: string
  source: string | null
  download?: boolean
}) {
  const response = await api.request<{ data: { href: string; source: string | null } }>({
    method: 'POST',
    url: '/game/library-folder-logos',
    data,
  })
  return response.data.data
}
