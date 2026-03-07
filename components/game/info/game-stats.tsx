'use client'

import { ClockIcon, Gamepad2Icon, StarIcon, TimerResetIcon } from 'lucide-react'
import { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
  onUpdatePlayStatus: (nextStatus: number) => void
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
}: {
  title: string
  icon: ReactNode
  value: ReactNode
  interactiveIcon?: boolean
}) => (
  <div className="rounded-md p-3">
    <div className="flex items-center justify-center gap-3">
      {interactiveIcon ? (
        icon
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          className="pointer-events-none"
          tabIndex={-1}
        >
          {icon}
        </Button>
      )}
      <div className="text-base font-medium">
        <div>
          <span>{title}</span>
        </div>
        <div>{value}</div>
      </div>
    </div>
  </div>
)

export default function GameStats({
  totalPlayTimeText,
  lastLaunchedAt,
  playStatus,
  isRunning,
  sessionSeconds,
  rating,
  isUpdatingStatus,
  onOpenPlayTime,
  onOpenRating,
  onUpdatePlayStatus,
}: GameStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <StatCard
        title="游玩时间"
        interactiveIcon
        icon={
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            aria-label="编辑游玩时间"
            className="text-muted-foreground hover:text-primary transition-colors"
            onClick={onOpenPlayTime}
          >
            <ClockIcon className="size-8" />
          </Button>
        }
        value={totalPlayTimeText}
      />
      <StatCard
        title="最后运行日期"
        icon={<TimerResetIcon className="size-8" />}
        value={formatDateOnly(lastLaunchedAt)}
      />
      <StatCard
        title="游玩状态"
        interactiveIcon
        icon={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                disabled={isUpdatingStatus}
                aria-label="修改游玩状态"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Gamepad2Icon className="size-8" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              {statusOptions.map((status) => (
                <DropdownMenuItem
                  key={status}
                  onClick={() => onUpdatePlayStatus(status)}
                >
                  {statusLabelMap[status]}
                  {playStatus === status ? (
                    <DropdownMenuShortcut>✔</DropdownMenuShortcut>
                  ) : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        }
        value={
          <div className="space-y-1">
            <div>{statusLabelMap[playStatus] ?? '未开始'}</div>
            {isRunning ? (
              <div className="text-muted-foreground text-xs">
                本次 {formatDuration(sessionSeconds)}
              </div>
            ) : null}
          </div>
        }
      />
      <StatCard
        title="我的评分"
        interactiveIcon
        icon={
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            aria-label="修改评分"
            className="text-muted-foreground hover:text-primary transition-colors"
            onClick={onOpenRating}
          >
            <StarIcon className="size-8" />
          </Button>
        }
        value={String(rating ?? 0)}
      />
    </div>
  )
}
