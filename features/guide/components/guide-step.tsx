'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { EditStep } from '@/features/guide/components/edit-step'
import { useGuideColors } from '@/features/guide/hooks/use-guide-colors'
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

export function GuideStep({ step, isCompleted, onToggle }: GuideStepProps) {
  const colors = useGuideColors()

  return (
    <div
      onClick={onToggle}
      className={cn(
        'group flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 select-none cursor-pointer',
        'hover:scale-[1.01] active:scale-[0.99]',
        isCompleted
          ? 'bg-muted/50 border-muted-foreground/20 opacity-75 hover:opacity-90'
          : 'bg-background border-border hover:border-primary/50 hover:bg-accent/40 hover:shadow-md',
      )}
    >
      <Checkbox
        checked={isCompleted}
        onCheckedChange={onToggle}
        className="pointer-events-none mt-0.5"
      />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'text-sm transition-colors duration-200',
            isCompleted && 'line-through opacity-50 group-hover:opacity-70',
          )}
          style={{
            color: isCompleted ? undefined : colors[step.type as keyof typeof colors] || undefined,
          }}
        >
          {step.prefix && <span className="mr-1 font-medium text-yellow-500">{step.prefix}</span>}
          {step.content}
          {step.subfix && <span className="text-muted-foreground ml-1">{step.subfix}</span>}
        </p>
      </div>
      <div className="opacity-0 transition-opacity group-hover:opacity-100">
        <EditStep stepId={step.id} />
      </div>
    </div>
  )
}
