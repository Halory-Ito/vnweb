import { useGameStatusNames } from './use-game-status-names'
import { useStatusColors } from '@/features/appearance/hooks/use-status-colors'
import { normalizeGamePlayStatus } from '@/features/game/lib/game-status'
import { getStatusColor } from '@/lib/settings/status-settings'

export function useGameCardTitleColor(status?: number | null) {
  const colors = useStatusColors()
  const { data: statusNames } = useGameStatusNames()

  if (typeof status !== 'number' || Number.isNaN(status)) return undefined

  return getStatusColor(colors, normalizeGamePlayStatus(status, statusNames))
}
