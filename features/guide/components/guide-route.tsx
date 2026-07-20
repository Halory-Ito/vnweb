'use client'

import { RotateCcw, ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'

import { GuideEnding } from './guide-ending'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Progress } from '@/components/ui/progress'

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
  onToggleStep: (stepId: string) => void
  onResetRoute: () => void
}

export function GuideRoute({
  route,
  progress,
  onToggleStep,
  onResetRoute,
}: GuideRouteProps) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card variant="default">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
                <div>
                  <CardTitle>{route.name}</CardTitle>
                  <CardDescription>
                    {route.endings.length} 个结局 · {progress.completed}/{progress.total} 步骤完成
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-32">
                  <Progress value={progress.percentage} className="h-2" />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onResetRoute()
                  }}
                  title="重置此路线进度"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-4 px-6 pb-6">
            {route.endings.map((ending) => (
              <GuideEnding
                key={ending.id}
                ending={ending}
                progress={{
                  total: ending.steps.length,
                  completed: ending.steps.filter((s) => s.finished).length,
                  percentage:
                    ending.steps.length > 0
                      ? Math.round(
                          (ending.steps.filter((s) => s.finished).length /
                            ending.steps.length) *
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
