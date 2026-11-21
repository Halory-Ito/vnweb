import { api } from '@/lib/request-utils'

import type { GameStatusNames } from '@/types/game'

export async function getGameStatusNames() {
  const response = await api.request<{ names: GameStatusNames }>({
    method: 'get',
    url: '/settings/appearance/status',
  })
  return response.data.names
}

export async function saveGameStatusNames(names: Partial<GameStatusNames>) {
  const response = await api.request<{ names: GameStatusNames }>({
    method: 'put',
    url: '/settings/appearance/status',
    data: names,
  })
  return response.data.names
}

export async function createGameStatus(name: string) {
  const response = await api.request<{ names: GameStatusNames }>({
    method: 'patch',
    url: '/settings/appearance/status',
    data: { name },
  })
  return response.data
}

export async function removeGameStatus(id: number) {
  const response = await api.request<{ names: GameStatusNames; affectedGames: number }>({
    method: 'delete',
    url: '/settings/appearance/status',
    data: { id },
  })
  return response.data
}
