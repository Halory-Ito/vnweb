'use client'

import { Disc3Icon, Loader2Icon } from 'lucide-react'

import { OstShelfDisc } from '@/features/ost/components/ost-shelf-disc'
import { OstShelfShowcase } from '@/features/ost/components/ost-shelf-showcase'
import { Skeleton } from '@/components/ui/skeleton'

import type { OstItem } from '../types'

type OstManageContentProps = {
  items: OstItem[]
  selectedItem: OstItem | null
  isLoading: boolean
  isRefetching: boolean
  onSelect: (item: OstItem) => void
  onEdit: (item: OstItem) => void
  onDelete: (item: OstItem) => void
}

export function OstManageContent({
  items,
  selectedItem,
  isLoading,
  isRefetching,
  onSelect,
  onEdit,
  onDelete,
}: OstManageContentProps) {
  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-52 w-full rounded-2xl" />
        <div className="flex -space-x-20 overflow-hidden rounded-2xl border-2 p-6 sm:-space-x-24">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-44 w-40 shrink-0 rounded-xl [transform:perspective(950px)_rotateY(52deg)] sm:h-52 sm:w-48"
            />
          ))}
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center">
        <div className="mb-3 flex size-14 items-center justify-center rounded-full border border-sky-300/60 bg-sky-50/50 text-sky-500 dark:border-sky-400/30 dark:bg-sky-950/20">
          <Disc3Icon className="size-6" />
        </div>
        <p className="text-sm font-medium">(´・ω・`) 唱片架上还是空的</p>
        <p className="text-muted-foreground mt-1 text-xs">
          点击上方“新增 OST”，把喜欢的原声带放进唱片架吧
        </p>
      </div>
    )
  }

  return (
    <div className="relative space-y-5">
      {isRefetching ? (
        <div className="bg-background/85 absolute top-3 right-3 z-20 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs shadow-xs backdrop-blur-xs">
          <Loader2Icon className="size-3 animate-spin" />
          更新中
        </div>
      ) : null}

      {/* 上方 3D 展示台 */}
      <OstShelfShowcase item={selectedItem} onEdit={onEdit} onDelete={onDelete} />

      {/* 下方 3D 侧摆唱片架 */}
      <div className="rounded-2xl border-2 p-4 sm:p-5">
        <div className="flex items-end -space-x-20 overflow-x-auto px-6 pt-14 pb-5 sm:-space-x-24 sm:px-8">
          {items.map((item) => (
            <OstShelfDisc
              key={item.id}
              item={item}
              isSelected={selectedItem?.id === item.id}
              onSelect={onSelect}
            />
          ))}
        </div>
        {/* 3D 倾斜质感层板底座 */}
        <div className="bg-border/70 h-3 w-full rounded-full border [transform:perspective(800px)_rotateX(42deg)] shadow-sm" />
      </div>
    </div>
  )
}
