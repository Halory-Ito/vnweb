'use client'

import { PvGridCard } from './pv-grid-card'
import { Button } from '@/components/ui/button'
import { EmptyArtwork } from '@/components/ui/empty-artwork'
import { Skeleton } from '@/components/ui/skeleton'

import type { PvCategoryFilter } from '../lib/pv-library'
import type { PvItem } from '../types'

type Props = {
  items: PvItem[]
  activeCategory: PvCategoryFilter
  hasMore: boolean
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  onSelect: (item: PvItem) => void
  onEdit: (item: PvItem) => void
  onDelete: (item: PvItem) => void
  onLoadMore: () => void
}

export function PvManageContent({
  items,
  activeCategory,
  hasMore,
  isLoading,
  isError,
  onRetry,
  onSelect,
  onEdit,
  onDelete,
  onLoadMore,
}: Props) {
  const layout = 'grid min-w-0 grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4'

  if (isLoading)
    return (
      <div className={layout} aria-label="正在加载 PV">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="aspect-video rounded-xl" />
        ))}
      </div>
    )

  if (isError && !items.length)
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-10">
        <p className="text-muted-foreground text-sm">PV 加载失败</p>
        <Button variant="outline" onClick={onRetry}>
          重试
        </Button>
      </div>
    )

  if (!items.length)
    return (
      <div className="text-muted-foreground flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center text-sm">
        <EmptyArtwork />
        当前条件下没有 PV
      </div>
    )

  return (
    <section aria-label="PV 列表" className="flex min-w-0 flex-col gap-4">
      <ul className={layout}>
        {items.map((item, index) => (
          <li key={item.id} className="min-w-0">
            <PvGridCard
              item={item}
              index={index}
              activeCategory={activeCategory}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </li>
        ))}
      </ul>
      {hasMore && (
        <Button variant="outline" onClick={onLoadMore} className="self-center">
          加载更多 PV
        </Button>
      )}
    </section>
  )
}
