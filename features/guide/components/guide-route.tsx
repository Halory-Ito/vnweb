'use client'

import { ChevronDown, ChevronRight, CircleCheckIcon } from 'lucide-react'
import { useState } from 'react'

import { GuideEnding } from './guide-ending'
import { ResetAllButton } from './reset-all-botton'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Progress } from '@/components/ui/progress'
import {
  getGuideProgressColor,
  GUIDE_COMPLETED_CARD_CLASS,
  GUIDE_PROGRESS_BAR_CLASS,
} from '@/features/guide/lib/guide-progress'
import { cn } from '@/lib/utils'

interface Step {
  id: string
  type: string
  content: string
  group?: string
  prefix?: string
  subfix?: string
  finished?: boolean
}

interface Ending {
  id: string
  name: string
  type: string
  steps: Step[]
  requirements?: string
  finished?: boolean
}

interface Route {
  id: string
  name: string
  endings: Ending[]
  finished?: boolean
}

interface RouteProgress {
  total: number
  completed: number
  percentage: number
}

interface GuideRouteProps {
  route: Route
  progress: RouteProgress
  hideCompleted?: boolean
  onToggleStep: (stepId: string) => void
  onResetRoute: () => void
}

export function GuideRoute({
  route,
  progress,
  hideCompleted = false,
  onToggleStep,
  onResetRoute,
}: GuideRouteProps) {
  const [isOpen, setIsOpen] = useState(() => progress.percentage < 100)
  const isCompleted = progress.percentage >= 100
  const progressColor = getGuideProgressColor(progress.percentage)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card
        variant="outline"
        className={cn('gap-0 overflow-hidden py-0', isCompleted && GUIDE_COMPLETED_CARD_CLASS)}
      >
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer py-4 transition-all duration-200">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Button variant="ghost" size="sm" className="h-6 w-6 shrink-0 p-0">
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
                <div className="min-w-0">
                  <CardTitle className="truncate">{route.name}</CardTitle>
                  <CardDescription>
                    {route.endings.length} 个结局 · {progress.completed}/{progress.total} 步骤完成
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isCompleted && (
                  <CircleCheckIcon
                    aria-hidden="true"
                    className={cn('size-4 shrink-0', progressColor)}
                  />
                )}
                <div className="w-28 sm:w-32">
                  <Progress
                    value={progress.percentage}
                    className={cn('h-2', GUIDE_PROGRESS_BAR_CLASS, progressColor)}
                  />
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <ResetAllButton
                    title="重置路线进度"
                    description={`确定要重置「${route.name}」路线的所有进度吗？此操作将清除该路线下所有结局和步骤的完成状态。`}
                    onConfirm={onResetRoute}
                    disabled={progress.completed === 0}
                    buttonTitle="重置此路线进度"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="divide-y border-t">
            {route.endings.map((ending) => (
              <GuideEnding
                key={ending.id}
                ending={ending}
                hideCompleted={hideCompleted}
                progress={{
                  total: ending.steps.length,
                  completed: ending.steps.filter((s) => s.finished).length,
                  percentage:
                    ending.steps.length > 0
                      ? Math.round(
                          (ending.steps.filter((s) => s.finished).length / ending.steps.length) *
                            100,
                        )
                      : 0,
                }}
                onToggleStep={onToggleStep}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
