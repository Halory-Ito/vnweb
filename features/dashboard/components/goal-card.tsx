'use client'

import { PencilIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

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
  return (
    <Card variant="outline" className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardAction className="flex items-center gap-1">
          <span className="text-muted-foreground">{icon}</span>
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
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-2xl">{currentText}</span>
          <span className="text-muted-foreground text-sm">目标 {targetText}</span>
        </div>
        <Progress value={percent} />
        <div className="text-muted-foreground text-right text-xs">已完成 {percent}%</div>
      </CardContent>
    </Card>
  )
}
