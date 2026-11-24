'use client'

import { CheckIcon, CircleCheckIcon } from 'lucide-react'
import Image from 'next/image'

import { getGuideProgressColor } from '@/features/guide/lib/guide-progress'
import { cn } from '@/lib/utils'

import type { GuideListItem } from '@/features/guide/guide-api'

interface GuideCardProps {
  guide: GuideListItem
  onClick?: () => void
  /** 已有选中项时为 true，此时点击卡片即切换选择 */
  selectionMode?: boolean
  isSelected?: boolean
  onToggleSelect?: (id: number) => void
}

export default function GuideCard({
  guide,
  onClick,
  selectionMode = false,
  isSelected = false,
  onToggleSelect,
}: GuideCardProps) {
  const handleCardClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // Ctrl / Cmd 点击随时进入多选
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault()
      onToggleSelect?.(guide.id)
      return
    }

    if (selectionMode && onToggleSelect) {
      onToggleSelect(guide.id)
      return
    }

    onClick?.()
  }

  const handleToggleSelect = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    onToggleSelect?.(guide.id)
  }

  const isCompleted = guide.percentage >= 100
  const progressColor = getGuideProgressColor(guide.percentage)

  return (
    <div
      className={cn(
        'group relative aspect-3/4 w-full cursor-pointer overflow-hidden rounded-lg transition-all hover:shadow-md',
        isCompleted && 'ring-2 ring-emerald-500/60',
      )}
      onClick={handleCardClick}
    >
      {/* 封面 */}
      {guide.cover ? (
        <Image
          src={guide.cover}
          alt={guide.name}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 220px"
          loading="eager"
          fill
          className="object-cover"
        />
      ) : (
        <div className="bg-muted flex h-full w-full items-center justify-center">
          <span className="text-muted-foreground text-xs">暂无封面</span>
        </div>
      )}

      {/* 多选圆点：移动端/已选中时始终可见，桌面端悬停显示 */}
      <button
        type="button"
        className={`absolute top-2 left-2 z-20 flex size-7 items-center justify-center rounded-full border-2 transition-all ${
          isSelected
            ? 'border-primary bg-primary text-primary-foreground scale-100 opacity-100'
            : 'bg-background/60 border-muted-foreground/40 scale-90 opacity-100 md:scale-90 md:opacity-0 md:group-hover:scale-100 md:group-hover:opacity-100'
        }`}
        onClick={handleToggleSelect}
        aria-label={isSelected ? '取消选择' : '选择'}
      >
        {isSelected ? <CheckIcon className="size-4" /> : null}
      </button>

      {/* 底部进度条 */}
      <div
        className={cn(
          'absolute bottom-0 left-0 h-2 w-full bg-current/25 transition-all group-hover:h-3',
          progressColor,
        )}
      >
        <div
          className="h-full bg-current transition-all"
          style={{ width: `${guide.percentage}%` }}
        />
      </div>

      {/* 移动端始终显示进度，PC端悬停显示（已完成始终提示） */}
      <div
        className={cn(
          'bg-background/85 absolute right-1 bottom-3 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium backdrop-blur-xs transition-opacity',
          progressColor,
          isCompleted ? 'opacity-100' : 'md:opacity-0 md:group-hover:opacity-100',
        )}
      >
        {isCompleted ? (
          <>
            <CircleCheckIcon aria-hidden="true" className="size-3" />
            已完成
          </>
        ) : (
          `${guide.percentage}%`
        )}
      </div>
    </div>
  )
}
