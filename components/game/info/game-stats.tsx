'use client'

import { ClockIcon, Gamepad2Icon, StarIcon, TimerResetIcon } from 'lucide-react'
import { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card'

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

const statusLabelMap: Record<number, string> = {
  0: '未开始',
  1: '游玩中',
  2: '部分完成',
  3: '已完成',
  4: '多周目',
  5: '搁置中',
}

const statusOptions = [0, 1, 2, 3, 4, 5] as const

const formatDuration = (seconds: number) => {
  const safe = Math.max(0, Math.floor(seconds))
  const hour = Math.floor(safe / 3600)
  const minute = Math.floor((safe % 3600) / 60)
  const second = safe % 60
  return `${hour.toString().padStart(2, '0')}:${minute
    .toString()
    .padStart(2, '0')}:${second.toString().padStart(2, '0')}`
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
    className={`group relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
      onClick ? 'cursor-pointer' : ''
    }`}
    onClick={onClick}
  >
    {/* 背景光效 */}
    <div className="bg-primary/5 pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardDescription className="text-xs font-medium tracking-wider uppercase">
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
    <CardContent>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
    </CardContent>
  </Card>
)

export default function GameStats({
  totalPlayTimeText,
  lastLaunchedAt,
  playStatus,
  isRunning,
  sessionSeconds,
  rating,
  onOpenPlayTime,
  onOpenRating,
  onOpenPlayStatus,
}: GameStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
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
        value={statusLabelMap[playStatus] ?? '未开始'}
      />
      <StatCard
        title="我的评分"
        interactiveIcon
        icon={<StarIcon className="size-5" />}
        onClick={onOpenRating}
        value={
          <div className="flex items-center gap-1">
            <span>{rating ?? 0}</span>
            <span className="text-muted-foreground text-sm font-normal">
              /10
            </span>
          </div>
        }
      />
    </div>
  )
}
