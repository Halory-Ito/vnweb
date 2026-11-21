'use client'

import { Loader2Icon } from 'lucide-react'
import { useReducedMotion } from 'motion/react'

import { EmptyArtwork } from '@/components/ui/empty-artwork'
import { Skeleton } from '@/components/ui/skeleton'
import { OstShelfShowcase } from '@/features/ost/components/ost-shelf-showcase'
import { OstShelfTier, OstShelfTierSkeleton } from '@/features/ost/components/ost-shelf-tier'

import type { OstItem } from '../types'

type OstManageContentProps = {
  items: OstItem[]
  page: number
  pageDirection: number
  recordsPerTier: number
  tierCount: number
  selectedItem: OstItem | null
  batchSelection?: ReadonlySet<number>
  isLoading: boolean
  isRefetching: boolean
  onSelect: (item: OstItem) => void
  onEdit: (item: OstItem) => void
  onDelete: (item: OstItem) => void
}

export function OstManageContent({
  items,
  page,
  pageDirection,
  recordsPerTier,
  tierCount,
  selectedItem,
  batchSelection,
  isLoading,
  isRefetching,
  onSelect,
  onEdit,
  onDelete,
}: OstManageContentProps) {
  const reduceMotion = Boolean(useReducedMotion())
  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-52 w-full rounded-2xl" />
        <div className="overflow-x-clip rounded-2xl border-2 p-2 sm:p-5">
          <OstShelfTierSkeleton count={recordsPerTier} />
        </div>
      </div>
    )
  }

  const emptyState = (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center">
      <EmptyArtwork className="mb-3" />
      <p className="text-sm font-medium">唱片架上还是空的</p>
      <p className="text-muted-foreground mt-1 text-xs">
        点击上方“新增 OST”，把喜欢的原声带放进唱片架吧
      </p>
    </div>
  )

  return (
    <div className="relative space-y-5">
      {isRefetching ? (
        <div className="bg-background/85 absolute top-3 right-3 z-20 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs shadow-xs backdrop-blur-xs">
          <Loader2Icon className="size-3 animate-spin" />
          更新中
        </div>
      ) : null}

      {/* 上方 3D 展示台 */}
      {items.length === 0 && emptyState}
      {items.length > 0 && !batchSelection && (
        <OstShelfShowcase item={selectedItem} onEdit={onEdit} onDelete={onDelete} />
      )}

      {/* 下方 3D 侧摆唱片架 */}
      <div className="overflow-x-clip rounded-2xl border-2 p-2 sm:p-5">
        {Array.from({ length: tierCount }, (_, index) => {
          const start = index * recordsPerTier
          const tierItems = items.slice(start, start + recordsPerTier)
          return (
            <OstShelfTier
              key={index}
              tierIndex={index}
              count={recordsPerTier}
              page={page}
              pageDirection={pageDirection}
              items={tierItems}
              selectedId={selectedItem?.id ?? null}
              batchSelection={batchSelection}
              reduceMotion={reduceMotion}
              onSelect={onSelect}
            />
          )
        })}
      </div>
    </div>
  )
}
