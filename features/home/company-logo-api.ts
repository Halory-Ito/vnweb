import { api } from '@/lib/request-utils'

type CompanyLogo = {
  id: string
  name: string
  logoUrl: string
}

export async function searchCompanyLogos(q: string, signal?: AbortSignal) {
  const response = await api.request<{ data: CompanyLogo[] }>({
    method: 'GET',
    url: '/game/company-logos',
    params: { q },
    signal,
  })
  return response.data.data
}
