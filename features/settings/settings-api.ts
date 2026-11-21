import { api } from '@/lib/request-utils'

export type ResourceCategory = 'image' | 'video' | 'audio' | 'font'

export type LocalResourceItem = {
  id: string
  name: string
  relativePath: string
  url: string
  category: ResourceCategory
  folder: string
  extension: string
  size: number
  modifiedAt: string
}

export type ResourceCategorySummary = {
  count: number
  size: number
}

export type LocalResourceSummary = {
  totalCount: number
  totalSize: number
  categories: Record<ResourceCategory, ResourceCategorySummary>
}

export type LocalResourcesResponse = {
  summary: LocalResourceSummary
  unusedSummary: LocalResourceSummary
  items: LocalResourceItem[]
}

export type DeleteLocalResourcesResult = {
  deleted: string[]
  failed: Array<{ path: string; reason: string }>
  freedBytes?: number
}

export async function getLocalResourcesApi(): Promise<LocalResourcesResponse> {
  const response = await api.request<{ data: LocalResourcesResponse }>({
    method: 'GET',
    url: '/settings/data',
  })
  return response.data.data
}

export async function deleteLocalResourcesApi(
  paths: string[],
): Promise<DeleteLocalResourcesResult> {
  const response = await api.request<{ data: DeleteLocalResourcesResult }>({
    method: 'DELETE',
    url: '/settings/data',
    data: { paths },
  })
  return response.data.data
}

export async function cleanupUnusedResourcesApi(): Promise<DeleteLocalResourcesResult> {
  const response = await api.request<{ data: DeleteLocalResourcesResult }>({
    method: 'DELETE',
    url: '/settings/data',
    data: { mode: 'unused' },
  })
  return response.data.data
}
