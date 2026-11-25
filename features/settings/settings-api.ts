import { api } from '@/lib/request-utils'

import type { ProjectUpdate } from './lib/project-update'
import type { LocalResourcesResponse } from '@/types/local-resource'

export type {
  LocalResourceItem,
  LocalResourceSummary,
  LocalResourcesResponse,
  ResourceCategory,
  ResourceCategorySummary,
} from '@/types/local-resource'

export type DeleteLocalResourcesResult = {
  deleted: string[]
  failed: Array<{ path: string; reason: string }>
  freedBytes?: number
}

export async function checkProjectUpdateApi(): Promise<ProjectUpdate> {
  const response = await api.request<ProjectUpdate>({
    method: 'GET',
    url: '/settings/about/update',
  })
  return response.data
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

export {
  getPlatformVisibilityApi,
  savePlatformVisibilityApi,
} from '@/lib/settings/platform-visibility'
