'use client'

import { CircleCheckIcon, CircleDot, Skull, Star } from 'lucide-react'
import Image from 'next/image'

import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  getGuideProgressColor,
  GUIDE_COMPLETED_CARD_CLASS,
  GUIDE_PROGRESS_BAR_CLASS,
} from '@/features/guide/lib/guide-progress'
import { cn } from '@/lib/utils'

const endingTypeConfig: Record<
  string,
  {
    label: string
    icon: React.ReactNode
    className: string
  }
> = {
  true: {
    label: '真结局',
    icon: <Star className="h-3 w-3 fill-current" />,
    className: 'border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400',
  },

  bad: {
    label: '坏结局',
    icon: <Skull className="h-3 w-3" />,
    className: 'border-red-500/30 bg-red-500/15 text-red-500 dark:text-red-400',
  },

  normal: {
    label: '普通结局',
    icon: <CircleDot className="h-3 w-3" />,
    className: 'border-primary/20 bg-primary/10 text-primary',
  },
}

interface EndingCardProps {
  name: string
  type: string
  cover?: string
  progress: {
    total: number
    completed: number
    percentage: number
  }
  onClick?: () => void
}

function getCharacterInitial(name: string) {
  return name.replace('END', '').replace('结局', '').trim().slice(0, 2) || '？'
}

export function EndingCard({ name, type, cover, progress, onClick }: EndingCardProps) {
  const config = endingTypeConfig[type] ?? endingTypeConfig.normal

  const isCompleted = progress.percentage >= 100
  const progressColor = getGuideProgressColor(progress.percentage)

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex w-full items-center gap-5 rounded-xl border bg-background p-5 text-left shadow-xs dark:border-input dark:bg-input/30',
        'transition-all duration-200',
        'hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg',
        'focus-visible:ring-2 focus-visible:ring-primary/40',
        isCompleted && GUIDE_COMPLETED_CARD_CLASS,
      )}
    >
      {/* Cover */}
      <div
        className={cn(
          'relative h-18 w-18 shrink-0 overflow-hidden rounded-lg border',
          'transition-transform duration-200 group-hover:scale-105',
          isCompleted && 'border-emerald-500/40',
        )}
      >
        {cover ? (
          <Image src={cover} alt={name} fill className="object-cover" />
        ) : (
          <div className="bg-muted flex h-full w-full items-center justify-center text-lg font-bold">
            {getCharacterInitial(name)}
          </div>
        )}
      </div>

      {/* Right */}
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        {/* 标题 */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-sm leading-5 font-semibold">{name}</h3>

          <div className="flex shrink-0 items-center gap-1.5">
            <Badge
              variant="outline"
              className={cn('gap-1 rounded-md px-2 py-0.5 text-[10px]', config.className)}
            >
              {config.icon}
              {config.label}
            </Badge>
          </div>
        </div>

        {/* Progress */}
        <Progress
          value={progress.percentage}
          className={cn('h-2', GUIDE_PROGRESS_BAR_CLASS, progressColor)}
        />

        {/* Footer */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground tabular-nums">
            {progress.completed}/{progress.total} 步骤
          </span>

          {isCompleted ? (
            <span className={cn('inline-flex items-center gap-1 font-medium', progressColor)}>
              <CircleCheckIcon aria-hidden="true" className="size-3.5" />
              已完成
            </span>
          ) : (
            <span className={cn('font-medium tabular-nums', progressColor)}>
              {progress.percentage}%
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
