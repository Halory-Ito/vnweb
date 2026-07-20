'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface RouteCardProps {
  routeId: string
  name: string
  endingCount: number
  progress: {
    total: number
    completed: number
    percentage: number
  }
  onClick?: () => void
}

export function RouteCard({ routeId, name, endingCount, progress, onClick }: RouteCardProps) {
  return (
    <Card
      variant="outline"
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/40"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-muted-foreground text-sm">{endingCount} 个结局</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">进度</span>
            <span className="text-muted-foreground tabular-nums">
              {progress.completed}/{progress.total}
            </span>
          </div>
          <Progress value={progress.percentage} className="h-1.5" />
        </div>
      </CardContent>
    </Card>
  )
}
