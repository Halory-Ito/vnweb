import { api } from '@/lib/request-utils'
import { readPlatformCache, writePlatformCache } from '@/lib/settings/platform-cache'

import type {
  GameStatusMappings,
  GameStatusPushColors,
  GameStatusPushState,
  GameStatusSyncProvider,
  GameStatusSyncResult,
  GameStatusSyncAvailability,
} from '@/types'

export async function getGameStatusMappings() {
  return readPlatformCache(
    'status-mappings',
    async () =>
      (
        await api.request<GameStatusMappings>({
          method: 'GET',
          url: '/settings/appearance/status/mappings',
        })
      ).data,
  )
}

export async function saveGameStatusMapping(
  statusId: number,
  provider: GameStatusSyncProvider,
  target: number | null,
) {
  const response = await api.request<GameStatusMappings>({
    method: 'PATCH',
    url: '/settings/appearance/status/mappings',
    data: { statusId, provider, target },
  })
  writePlatformCache('status-mappings', response.data)
  return response.data
}

export async function getGameStatusSyncAvailability(gameId: number) {
  return (
    await api.request<GameStatusSyncAvailability[]>({
      method: 'GET',
      url: `/game/${gameId}/status-sync`,
    })
  ).data
}

export async function bindGameStatusSyncEntry(
  gameId: number,
  provider: GameStatusSyncProvider,
  externalId: string,
) {
  await api.request({
    method: 'PATCH',
    url: `/game/${gameId}/status-sync`,
    data: { provider, externalId },
  })
}

export async function syncGameStatusToPlatform(
  gameId: number,
  provider: GameStatusSyncProvider,
  status: number,
) {
  return (
    await api.request<GameStatusSyncResult>({
      method: 'POST',
      url: `/game/${gameId}/status-sync`,
      data: { provider, status },
    })
  ).data
}

export async function getGameStatusPushColors() {
  return (
    await api.request<GameStatusPushColors>({
      method: 'GET',
      url: '/settings/appearance/status/push-colors',
    })
  ).data
}

export async function saveGameStatusPushColor(state: GameStatusPushState, color: string) {
  await api.request({
    method: 'PATCH',
    url: '/settings/appearance/status/push-colors',
    data: { state, color },
  })
}
