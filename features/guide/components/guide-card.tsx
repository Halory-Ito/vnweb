'use client'

import Image from 'next/image'

import type { GuideListItem } from '@/features/guide/guide-api'

interface GuideCardProps {
  guide: GuideListItem
  onClick?: () => void
}

export default function GuideCard({ guide, onClick }: GuideCardProps) {
  return (
    <div
      className="group relative h-64 cursor-pointer overflow-hidden rounded-lg transition-all hover:shadow-md"
      onClick={onClick}
    >
      {/* 封面 */}
      {guide.cover ? (
        <Image src={guide.cover} alt={guide.name} fill className="object-cover" />
      ) : (
        <div className="bg-muted flex h-64 w-full items-center justify-center">
          <span className="text-muted-foreground text-xs">暂无封面</span>
        </div>
      )}

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
