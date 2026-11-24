'use client'

import { Eye, EyeOff, List, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useGuideColors } from '@/features/guide/hooks/use-guide-colors'
import { cn } from '@/lib/utils'

interface GameGuideToolbarProps {
  characterMode: boolean
  onCharacterModeChange: (checked: boolean) => void
  hideCompleted: boolean
  onToggleHideCompleted: () => void
}

export function GameGuideToolbar({
  characterMode,
  onCharacterModeChange,
  hideCompleted,
  onToggleHideCompleted,
}: GameGuideToolbarProps) {
  const colors = useGuideColors()

  const colorLegend = [
    { label: '选项', color: colors.choice },
    { label: '保存', color: colors.save },
    { label: '读取', color: colors.load },
    { label: '备注', color: colors.note },
  ]

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onCharacterModeChange(false)}
            className={cn(
              !characterMode
                ? 'border-primary/50 bg-accent/60 text-foreground'
                : 'text-muted-foreground',
            )}
          >
            <List className="size-4" />
            路线列表
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onCharacterModeChange(true)}
            className={cn(
              characterMode
                ? 'border-primary/50 bg-accent/60 text-foreground'
                : 'text-muted-foreground',
            )}
          >
            <Users className="size-4" />
            角色卡片
          </Button>
        </div>

        <Button type="button" variant="outline" size="sm" onClick={onToggleHideCompleted}>
          {hideCompleted ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
          {hideCompleted ? '显示已完成' : '隐藏已完成'}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs">
        {colorLegend.map((item) => (
          <span key={item.label} className="inline-flex items-center gap-1.5">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
              aria-hidden="true"
            />
            <span className="text-muted-foreground">{item.label}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
