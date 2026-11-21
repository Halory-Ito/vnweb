'use client'

import { ClockIcon, Gamepad2Icon, StarIcon, TimerResetIcon } from 'lucide-react'
import { ReactNode } from 'react'

import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { useGameStatusNames } from '@/features/game/hooks/use-game-status-names'
import { getGamePlayStatusLabel } from '@/features/game/lib/game-status'

type GameStatsProps = {
  totalPlayTimeText: string
  lastLaunchedAt: string
  playStatus: number
  isRunning: boolean
  sessionSeconds: number
  rating: number
  isUpdatingStatus: boolean
  onOpenPlayTime: () => void
  onOpenRating: () => void
  onOpenPlayStatus: () => void
}

const formatDateOnly = (value: string) => {
  if (!value) {
    return '-'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleDateString('zh-CN')
}

const StatCard = ({
  title,
  icon,
  value,
  interactiveIcon = false,
  onClick,
}: {
  title: string
  icon: ReactNode
  value: ReactNode
  interactiveIcon?: boolean
  onClick?: () => void
}) => (
  <Card
    variant="outline"
    className={`group relative min-w-0 gap-3 overflow-hidden py-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md @min-[44rem]:gap-4 @min-[44rem]:py-4 ${
      onClick ? 'cursor-pointer' : ''
    }`}
    onClick={onClick}
  >
    {/* 背景光效 */}
    <div className="bg-primary/5 pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    <CardHeader className="flex flex-row items-center justify-between gap-2 px-3 @min-[44rem]:px-4 [&>div:last-child]:shrink-0">
      <CardDescription className="min-w-0 text-xs font-medium wrap-anywhere">
        {title}
      </CardDescription>
      {interactiveIcon ? (
        <div className="text-muted-foreground/60 group-hover:text-primary transition-colors duration-300">
          {icon}
        </div>
      ) : (
        <div className="text-muted-foreground/60">{icon}</div>
      )}
    </CardHeader>
    <CardContent className="min-w-0 px-3 @min-[44rem]:px-4">
      <div className="text-lg leading-tight font-bold wrap-anywhere tabular-nums @min-[44rem]:text-xl">
        {value}
      </div>
    </CardContent>
  </Card>
)

export default function GameStats({
  totalPlayTimeText,
  lastLaunchedAt,
  playStatus,
  rating,
  onOpenPlayTime,
  onOpenRating,
  onOpenPlayStatus,
}: GameStatsProps) {
  const { data: statusNames } = useGameStatusNames()
  return (
    <div className="@container min-w-0">
      <div className="grid grid-cols-1 gap-3 @min-[15rem]:grid-cols-2 @min-[44rem]:grid-cols-4 @min-[44rem]:gap-4">
        <StatCard
          title="游玩时间"
          interactiveIcon
          icon={<ClockIcon className="size-5" />}
          onClick={onOpenPlayTime}
          value={totalPlayTimeText}
        />
        <StatCard
          title="最后运行"
          icon={<TimerResetIcon className="size-5" />}
          value={formatDateOnly(lastLaunchedAt)}
        />
        <StatCard
          title="游玩状态"
          interactiveIcon
          icon={<Gamepad2Icon className="size-5" />}
          onClick={onOpenPlayStatus}
          value={getGamePlayStatusLabel(playStatus, statusNames)}
        />
        <StatCard
          title="我的评分"
          interactiveIcon
          icon={<StarIcon className="size-5" />}
          onClick={onOpenRating}
          value={
            <div className="flex flex-wrap items-baseline gap-x-1">
              <span>{rating ?? 0}</span>
              <span className="text-muted-foreground text-sm font-normal">/10</span>
            </div>
          }
        />
      </div>
    </div>
  )
}
