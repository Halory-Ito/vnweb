'use client'

import { ArrowLeftIcon, CircleDot, Lock, Skull, Star } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GuideCharacterCard } from '@/features/guide/components/guide-character-card'
import { GuideDetailHeader } from '@/features/guide/components/guide-detail-header'
import { GuideStep } from '@/features/guide/components/guide-step'
import { cn } from '@/lib/utils'

import type { GuideEndingWithProgress } from '@/features/guide'

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

interface GameGuideCharacterPanelProps {
  endings: GuideEndingWithProgress[]
  selectedEnding: GuideEndingWithProgress | null
  hideCompleted: boolean
  getEndingProgress: (ending: GuideEndingWithProgress) => {
    total: number
    completed: number
    percentage: number
  }
  onSelectEnding: (endingId: string | null) => void
  onToggleStep: (stepId: string) => void
}

export function GameGuideCharacterPanel({
  endings,
  selectedEnding,
  hideCompleted,
  getEndingProgress,
  onSelectEnding,
  onToggleStep,
}: GameGuideCharacterPanelProps) {
  if (!selectedEnding) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {endings.map((ending) => (
          <GuideCharacterCard
            key={ending.id}
            ending={ending}
            progress={getEndingProgress(ending)}
            onClick={() => onSelectEnding(ending.id)}
          />
        ))}
      </div>
    )
  }

  const progress = getEndingProgress(selectedEnding)
  const typeConfig = endingTypeConfig[selectedEnding.type] || endingTypeConfig.normal
  const filteredSteps = hideCompleted
    ? selectedEnding.steps.filter((step) => !step.finished)
    : selectedEnding.steps

  let lastGroup: string | undefined
  const stepElements: React.ReactNode[] = []
  filteredSteps.forEach((step, index) => {
    if (step.group && step.group !== lastGroup) {
      stepElements.push(
        <div
          key={`group-${step.group}-${index}`}
          className="text-primary bg-primary/10 mt-2 rounded px-2 py-1 text-xs font-medium first:mt-0"
        >
          {step.group}
        </div>,
      )
      lastGroup = step.group
    } else if (!step.group) {
      lastGroup = undefined
    }

    stepElements.push(
      <GuideStep
        key={step.id}
        step={step}
        isCompleted={!!step.finished}
        onToggle={() => onToggleStep(step.id)}
      />,
    )
  })

  return (
    <div className="space-y-4">
      <Button type="button" variant="ghost" size="sm" onClick={() => onSelectEnding(null)}>
        <ArrowLeftIcon className="mr-1 h-4 w-4" />
        返回角色列表
      </Button>

      <GuideDetailHeader
        title={
          <div className="flex flex-wrap items-center gap-2">
            <span>{selectedEnding.name}</span>
            <Badge variant="outline" className={cn('gap-1 text-xs', typeConfig.className)}>
              {typeConfig.icon}
              {typeConfig.label}
            </Badge>
          </div>
        }
        description={`${progress.completed}/${progress.total} 步骤完成`}
        progress={progress}
      />

      {selectedEnding.requirements && (
        <div className="flex items-start gap-2 rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-400">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="font-medium">开启条件：</span>
          <span>{selectedEnding.requirements}</span>
        </div>
      )}

      {stepElements.length > 0 ? (
        <div className="space-y-2">{stepElements}</div>
      ) : (
        <div className="text-muted-foreground rounded-lg border border-dashed py-6 text-center text-sm">
          当前结局步骤已全部完成
        </div>
      )}
    </div>
  )
}
