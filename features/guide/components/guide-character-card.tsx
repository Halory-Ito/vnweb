'use client'

import { Star, Skull, CircleDot } from 'lucide-react'
import Image from 'next/image'

import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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

interface Ending {
  id: string
  name: string
  type: string
  cover?: string
  steps: Array<{
    id: string
    type: string
    content: string
    group?: string
    prefix?: string
    subfix?: string
  }>
  requirements?: string
}

interface EndingProgress {
  total: number
  completed: number
  percentage: number
}

interface GuideCharacterCardProps {
  ending: Ending
  progress: EndingProgress
  onClick: () => void
}

function getCharacterInitial(name: string): string {
  const match = name.match(/^[一-龥]{2}/)
  return match ? match[0] : name.charAt(0)
}

export function GuideCharacterCard({ ending, progress, onClick }: GuideCharacterCardProps) {
  const isCompleted = progress.percentage === 100

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex flex-col items-center gap-3 rounded-xl border p-4 transition-all duration-200 cursor-pointer text-left',
        'bg-card hover:shadow-md hover:scale-[1.02] active:scale-[0.98]',
        isCompleted && 'ring-2 ring-emerald-500/50',
      )}
    >
      {/* 头像 */}
      <div className="relative h-16 w-16 overflow-hidden rounded-full transition-transform duration-200 group-hover:scale-110">
        {ending.cover ? (
          <Image src={ending.cover} alt={ending.name} fill className="object-cover" />
        ) : (
          <div className="bg-muted flex h-full w-full items-center justify-center text-xl font-bold">
            {getCharacterInitial(ending.name)}
          </div>
        )}
      </div>

      {/* 名称 */}
      <h3 className="text-center text-sm leading-tight font-semibold">{ending.name}</h3>

      {/* 类型标签 */}
      {(() => {
        const config = endingTypeConfig[ending.type] || endingTypeConfig.normal
        return (
          <Badge variant="outline" className={cn('text-xs gap-1', config.className)}>
            {config.icon}
            {config.label}
          </Badge>
        )
      })()}

      {/* 进度条 */}
      <div className="w-full space-y-1">
        <Progress
          value={progress.percentage}
          className={cn('h-1.5', isCompleted && '[&>div]:bg-emerald-500')}
        />
        <div className="text-muted-foreground flex items-center justify-between text-xs">
          <span>
            {progress.completed}/{progress.total} 步骤
          </span>
          <span className="tabular-nums">{progress.percentage}%</span>
        </div>
      </div>

      {/* 完成标记 */}
      {isCompleted && (
        <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-xs text-white">
          ✓
        </div>
      )}
    </button>
  )
}
