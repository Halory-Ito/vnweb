'use client'

import { FilmIcon } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'
import { PvFilmstrip } from '@/features/pv/components/pv-filmstrip'
import { PvTheaterStage } from '@/features/pv/components/pv-theater-stage'

import type { PvItem } from '../types'

type ResolvedVideo = {
  mode: 'direct' | 'embed' | 'none'
  embedUrl: string
  playUrl: string
}

type PvManageContentProps = {
  items: PvItem[]
  totalCount: number
  hasMore: boolean
  activeItem: PvItem | null
  resolvedVideo: ResolvedVideo
  isLoading: boolean
  isRefetching: boolean
  onSelect: (item: PvItem) => void
  onLoadMore: () => void
  onVideoRef: (el: HTMLVideoElement | null) => void
  onEdit: (item: PvItem) => void
  onDelete: (item: PvItem) => void
}

export function PvManageContent({
  items,
  totalCount,
  hasMore,
  activeItem,
  resolvedVideo,
  isLoading,
  isRefetching,
  onSelect,
  onLoadMore,
  onVideoRef,
  onEdit,
  onDelete,
}: PvManageContentProps) {
  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-72 w-full rounded-2xl sm:h-96" />
        <div className="flex gap-3.5 overflow-hidden rounded-2xl border-2 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-56 shrink-0 rounded-xl sm:w-64" />
          ))}
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center">
        <div className="mb-3 flex size-14 items-center justify-center rounded-full border border-sky-300/60 bg-sky-50/50 text-sky-500 dark:border-sky-400/30 dark:bg-sky-950/20">
          <FilmIcon className="size-6" />
        </div>
        <p className="text-sm font-medium">(´・ω・`) 放映室里还没有收录 PV</p>
        <p className="text-muted-foreground mt-1 text-xs">
          点击右上角“新增 PV”，把喜欢的 OP / ED 或宣传片收藏进来吧
        </p>
      </div>
    )
  }

  const activeIndex = activeItem ? items.findIndex((i) => i.id === activeItem.id) : -1
  const hasPrev = activeIndex > 0
  const hasNext = activeIndex >= 0 && activeIndex < items.length - 1

  return (
    <div className="space-y-5">
      <PvTheaterStage
        item={activeItem}
        resolvedVideo={resolvedVideo}
        hasPrev={hasPrev}
        hasNext={hasNext}
        onPrev={() => {
          if (hasPrev) onSelect(items[activeIndex - 1])
        }}
        onNext={() => {
          if (hasNext) onSelect(items[activeIndex + 1])
        }}
        onVideoRef={onVideoRef}
        onEdit={onEdit}
        onDelete={onDelete}
      />

      <PvFilmstrip
        items={items}
        totalCount={totalCount}
        hasMore={hasMore}
        activeId={activeItem?.id ?? null}
        isRefetching={isRefetching}
        onSelect={onSelect}
        onLoadMore={onLoadMore}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  )
}
