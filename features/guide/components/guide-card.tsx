'use client'

import { CheckIcon } from 'lucide-react'
import Image from 'next/image'

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

  return (
    <div
      className="group relative h-64 cursor-pointer overflow-hidden rounded-lg transition-all hover:shadow-md"
      onClick={handleCardClick}
    >
      {/* 封面 */}
      {guide.cover ? (
        <Image
          src={guide.cover}
          alt={guide.name}
          sizes="256"
          loading="eager"
          fill
          className="object-cover"
        />
      ) : (
        <div className="bg-muted flex h-64 w-full items-center justify-center">
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
      <div className="bg-primary/60 absolute bottom-0 left-0 h-2 w-full transition-all group-hover:h-3">
        <div
          className="bg-primary h-full shadow-[0_0_8px_var(--primary)] transition-all group-hover:shadow-[0_0_12px_var(--primary)]"
          style={{ width: `${guide.percentage}%` }}
        />
      </div>

      {/* 移动端始终显示百分比，PC端悬停显示 */}
      <div className="bg-primary/80 text-primary-foreground absolute right-1 bottom-3 rounded px-1.5 py-0.5 text-xs font-medium transition-opacity md:opacity-0 md:group-hover:opacity-100">
        {guide.percentage}%
      </div>
    </div>
  )
}
