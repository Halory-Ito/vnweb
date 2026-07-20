'use client'

import { useState } from 'react'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import { ChevronDown, ChevronRight, Lock, Star, Skull, CircleDot } from 'lucide-react'
import { GuideStep } from './guide-step'
import { cn } from '@/lib/utils'

const endingTypeConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  true: {
    label: '真结局',
    icon: <Star className="h-3 w-3" />,
    className: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
  },
  bad: {
    label: '坏结局',
    icon: <Skull className="h-3 w-3" />,
    className: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30'
  },
  normal: {
    label: '普通结局',
    icon: <CircleDot className="h-3 w-3" />,
    className: 'bg-primary/10 text-primary border-primary/20'
  }
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
  onToggleStep: (stepId: string) => void
}

export function GuideEnding({
  ending,
  progress,
  onToggleStep
}: GuideEndingProps) {
  const [isOpen, setIsOpen] = useState(true)

  // 处理步骤分组，相同group只显示一次日期
  const renderStepsWithGroups = () => {
    let lastGroup: string | undefined
    const elements: React.ReactNode[] = []

    ending.steps.forEach((step, index) => {
      // 如果当前步骤有group，且与上一个不同，或者是第一个步骤
      if (step.group && step.group !== lastGroup) {
        elements.push(
          <div
            key={`group-${step.group}-${index}`}
            className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded mt-2 first:mt-0"
          >
            {step.group}
          </div>
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
        />
      )
    })

    return elements
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border rounded-lg bg-card overflow-hidden">
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/30 transition-all duration-200">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="p-0 h-6 w-6">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{ending.name}</h4>
                {(() => {
                  const config = endingTypeConfig[ending.type] || endingTypeConfig.normal
                  return (
                    <Badge variant="outline" className={cn('text-xs gap-1', config.className)}>
                      {config.icon}
                      {config.label}
                    </Badge>
                  )
                })()}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {progress.completed}/{progress.total}
              </span>
              <div className="w-24">
                <Progress value={progress.percentage} className="h-2" />
              </div>
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-2 border-t pt-3">
            {ending.requirements && (
              <div className="flex items-start gap-2 rounded-md bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-sm text-amber-600 dark:text-amber-400">
                <Lock className="h-4 w-4 mt-0.5 shrink-0" />
                <span className="font-medium">开启条件：</span>
                <span>{ending.requirements}</span>
              </div>
            )}
            {renderStepsWithGroups()}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
