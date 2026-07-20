'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

interface Step {
  id: string
  type: string
  content: string
  group?: string
  prefix?: string
  subfix?: string
}

interface GuideStepProps {
  step: Step
  isCompleted: boolean
  onToggle: () => void
}

const stepTypeColors: Record<string, string> = {
  choice: 'text-primary',
  save: 'text-emerald-600 dark:text-emerald-400',
  load: 'text-amber-600 dark:text-amber-400',
  note: 'text-muted-foreground'
}

export function GuideStep({ step, isCompleted, onToggle }: GuideStepProps) {
  return (
    <label
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer select-none',
        isCompleted
          ? 'bg-muted/50 border-muted-foreground/20 opacity-75'
          : 'bg-background border-border hover:border-primary/40 hover:bg-accent/30 hover:shadow-sm'
      )}
    >
      <Checkbox
        checked={isCompleted}
        onCheckedChange={onToggle}
        className="mt-0.5 pointer-events-none"
      />
      <div className="flex-1">
        <p
          className={cn(
            'text-sm',
            stepTypeColors[step.type] || 'text-foreground',
            isCompleted && 'line-through opacity-50'
          )}
        >
          {step.prefix && (
            <span className="text-yellow-500 mr-1">{step.prefix}</span>
          )}
          {step.content}
          {step.subfix && (
            <span className="text-muted-foreground ml-1">{step.subfix}</span>
          )}
        </p>
      </div>
    </label>
  )
}
