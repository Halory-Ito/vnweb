'use client'

import {
  ChevronDown,
  ChevronRight,
  CircleCheckIcon,
  CircleDot,
  Lock,
  Skull,
  Star,
} from 'lucide-react'
import { useState } from 'react'

import { GuideStep } from './guide-step'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Progress } from '@/components/ui/progress'
import {
  getGuideProgressColor,
  GUIDE_PROGRESS_BAR_CLASS,
} from '@/features/guide/lib/guide-progress'
import { cn } from '@/lib/utils'

const endingTypeConfig: Record<
  string,
  { label: string; icon: React.ReactNode; className: string }
> = {
  true: {
    label: '真结局',
    icon: <Star className="h-3 w-3" />,
    className: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
  },
  bad: {
    label: '坏结局',
    icon: <Skull className="h-3 w-3" />,
    className: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
  },
  normal: {
    label: '普通结局',
    icon: <CircleDot className="h-3 w-3" />,
    className: 'bg-primary/10 text-primary border-primary/20',
  },
}

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

interface EndingProgress {
  total: number
  completed: number
  percentage: number
}

interface GuideEndingProps {
  ending: Ending
  progress: EndingProgress
  hideCompleted?: boolean
  onToggleStep: (stepId: string) => void
}

export function GuideEnding({
  ending,
  progress,
  hideCompleted = false,
  onToggleStep,
}: GuideEndingProps) {
  const [isOpen, setIsOpen] = useState(() => progress.percentage < 100)
  const isCompleted = progress.percentage >= 100
  const progressColor = getGuideProgressColor(progress.percentage)

  // 处理步骤分组，相同group只显示一次日期
  const renderStepsWithGroups = () => {
    let lastGroup: string | undefined
    const elements: React.ReactNode[] = []
    const visibleSteps = hideCompleted
      ? ending.steps.filter((step) => !step.finished)
      : ending.steps

    visibleSteps.forEach((step, index) => {
      // 如果当前步骤有group，且与上一个不同，或者是第一个步骤
      if (step.group && step.group !== lastGroup) {
        elements.push(
          <div
            key={`group-${step.group}-${index}`}
            className="text-primary bg-primary/10 mt-2 rounded px-2 py-1 text-xs font-medium first:mt-0"
          >
            {step.group}
          </div>,
        )
        lastGroup = step.group
      } else if (!step.group) {
        // 如果没有group，重置lastGroup
        lastGroup = undefined
      }

      elements.push(
        <GuideStep
          key={step.id}
          step={step}
          isCompleted={!!step.finished}
          onToggle={() => onToggleStep(step.id)}
        />,
      )
    })

    return elements
  }

  const stepElements = renderStepsWithGroups()

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn(isCompleted && 'bg-emerald-500/5')}>
        <CollapsibleTrigger asChild>
          <div className="hover:bg-accent/25 flex cursor-pointer items-center justify-between gap-3 px-4 py-3 transition-colors duration-200">
            <div className="flex min-w-0 items-center gap-2.5">
              <Button variant="ghost" size="sm" className="h-6 w-6 shrink-0 p-0">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h4 className="truncate text-sm font-medium">{ending.name}</h4>
                {(() => {
                  const config = endingTypeConfig[ending.type] || endingTypeConfig.normal
                  return (
                    <Badge variant="outline" className={cn('gap-1 text-xs', config.className)}>
                      {config.icon}
                      {config.label}
                    </Badge>
                  )
                })()}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span
                className={cn(
                  'inline-flex items-center gap-1 text-xs tabular-nums sm:text-sm',
                  isCompleted ? cn('font-medium', progressColor) : 'text-muted-foreground',
                )}
              >
                {isCompleted && <CircleCheckIcon aria-hidden="true" className="size-3.5" />}
                {progress.completed}/{progress.total}
              </span>
              <div className="w-20 sm:w-24">
                <Progress
                  value={progress.percentage}
                  className={cn('h-2', GUIDE_PROGRESS_BAR_CLASS, progressColor)}
                />
              </div>
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-2 px-4 pt-1 pb-4">
            {ending.requirements && (
              <div className="flex items-start gap-2 rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-400">
                <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="font-medium">开启条件：</span>
                <span>{ending.requirements}</span>
              </div>
            )}
            {stepElements.length > 0 ? (
              stepElements
            ) : (
              <p className="text-muted-foreground py-2 text-center text-xs">
                当前结局步骤已全部完成
              </p>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
