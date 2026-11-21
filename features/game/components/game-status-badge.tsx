'use client'

import { Badge } from '@/components/ui/badge'
import { useStatusColors } from '@/features/appearance/hooks/use-status-colors'
import { useGameStatusNames } from '@/features/game/hooks/use-game-status-names'
import { getGamePlayStatusLabel, normalizeGamePlayStatus } from '@/features/game/lib/game-status'
import { getStatusColor } from '@/lib/settings/status-settings'
import { cn } from '@/lib/utils'

type GameStatusBadgeProps = {
  status?: number | null
  className?: string
}

/** 游戏卡片右上角的游玩状态标签 */
export default function GameStatusBadge({ status, className }: GameStatusBadgeProps) {
  const colors = useStatusColors()
  const { data: statusNames } = useGameStatusNames()

  if (typeof status !== 'number' || Number.isNaN(status)) {
    return null
  }

  const label = getGamePlayStatusLabel(status, statusNames)
  const activeStatus = normalizeGamePlayStatus(status, statusNames)

  return (
    <Badge
      variant="outline"
      title={`游玩状态：${label}`}
      className={cn(
        'pointer-events-none absolute top-2 right-2 z-10 max-w-[calc(100%-1rem)] gap-1.5 border-white/20 bg-black/60 px-2 py-0.5 text-white shadow-sm backdrop-blur-sm',
        className,
      )}
    >
      <span
        className={cn('size-1.5 shrink-0 rounded-full', activeStatus === 1 && 'animate-pulse')}
        style={{ backgroundColor: getStatusColor(colors, activeStatus) }}
        aria-hidden
      />
      <span className="truncate">{label}</span>
    </Badge>
  )
}
