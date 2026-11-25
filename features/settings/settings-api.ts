import { api } from '@/lib/request-utils'
import { readPlatformCache, writePlatformCache } from '@/lib/settings/platform-cache'

import type { ProjectUpdate } from './lib/project-update'
import type { PlatformVisibility, PlatformVisibilityKey } from '@/lib/settings/platform-visibility'
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

export const getPlatformVisibilityApi = async () =>
  readPlatformCache(
    'visibility',
    async () =>
      (
        await api.request<PlatformVisibility>({
          method: 'GET',
          url: '/settings/platform/visibility',
        })
      ).data,
  )
export const savePlatformVisibilityApi = async (data: {
  platform: PlatformVisibilityKey
  visible: boolean
}) => {
  const response = await api.request<PlatformVisibility>({
    method: 'PATCH',
    url: '/settings/platform/visibility',
    data,
  })
  writePlatformCache('visibility', response.data)
  return response.data
}
