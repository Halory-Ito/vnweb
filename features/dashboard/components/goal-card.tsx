'use client'

import { CircleCheckIcon, PencilIcon } from 'lucide-react'

import { getGoalProgressColor } from '../lib/goal-utils'
import GoalProgressRing from './goal-progress-ring'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

type GoalCardProps = {
  title: string
  icon: React.ReactNode
  currentText: string
  targetText: string
  percent: number
  onEdit: () => void
}

export default function GoalCard({
  title,
  icon,
  currentText,
  targetText,
  percent,
  onEdit,
}: GoalCardProps) {
  const achieved = percent === 100
  const progressColor = getGoalProgressColor(percent)
  return (
    <Card variant="outline" className="w-full min-w-0 gap-3 py-3 md:gap-6 md:py-6">
      <CardHeader className="flex items-center justify-center gap-1 px-3 md:grid md:items-start md:justify-normal md:gap-2 md:px-6">
        <CardTitle className="text-center text-xs leading-5 md:text-left md:text-base md:leading-none">
          {title}
        </CardTitle>
        <CardAction className="hidden items-center gap-1 md:flex">
          <span className="text-muted-foreground hidden md:inline-flex">{icon}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label={`编辑${title}`}
            onClick={onEdit}
          >
            <PencilIcon className="size-4" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="px-3 md:px-6">
        <div className="md:hidden">
          <Button
            type="button"
            variant="ghost"
            className="mx-auto block h-auto w-full max-w-28 rounded-full p-0"
            aria-label={`编辑${title}`}
            aria-description={`${currentText}，目标 ${targetText}，已完成 ${percent}%`}
            aria-haspopup="dialog"
            onClick={onEdit}
          >
            <GoalProgressRing
              title={title}
              currentText={currentText}
              targetText={targetText}
              percent={percent}
              progressColor={progressColor}
            />
          </Button>
        </div>
        <div className="hidden space-y-3 md:block">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl">{currentText}</span>
            <span className="text-muted-foreground text-sm">目标 {targetText}</span>
          </div>
          <Progress
            value={percent}
            aria-label={title}
            className={cn(
              'bg-current/20 [&_[data-slot=progress-indicator]]:bg-current',
              progressColor,
            )}
          />
          {achieved ? null : (
            <div className="text-muted-foreground text-right text-xs">已完成 {percent}%</div>
          )}
        </div>
        {achieved ? (
          <div
            className={cn(
              'mt-2 flex items-center justify-center gap-1 text-xs font-medium md:mt-3 md:justify-end',
              progressColor,
            )}
          >
            <CircleCheckIcon aria-hidden="true" className="size-4" />
            已达标
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
