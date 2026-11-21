'use client'

import { FilmIcon } from 'lucide-react'

import { formatPvDuration, getPvCategoryLabel, PV_FILTERS } from '../lib/pv-library'
import { PvCover } from './pv-cover'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

import type { PvItem } from '../types'

type Props = {
  items: PvItem[]
  total: number
  hasMore: boolean
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  onSelect: (item: PvItem) => void
  onLoadMore: () => void
}

export function PvManageContent({
  items,
  total,
  hasMore,
  isLoading,
  isError,
  onRetry,
  onSelect,
  onLoadMore,
}: Props) {
  const layout = 'grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4'

  if (isLoading)
    return (
      <div className={layout} aria-label="正在加载 PV">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="aspect-video" />
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
        <FilmIcon aria-hidden="true" className="size-6" />
        当前条件下没有 PV
      </div>
    )

  return (
    <section aria-label="PV 列表" className="flex min-w-0 flex-col gap-3">
      <p className="text-muted-foreground text-xs" aria-live="polite">
        共 {total} 条 PV
      </p>
      <ul className={layout}>
        {items.map((item) => (
          <li key={item.id} className="min-w-0">
            <Card
              variant="outline"
              className="group hover:border-ring/50 relative h-full gap-0 overflow-hidden p-0 transition-colors"
            >
              <Button
                variant="ghost"
                aria-label={`预览并编辑 ${item.name}`}
                aria-haspopup="dialog"
                onClick={() => onSelect(item)}
                className="absolute inset-0 z-10 size-full rounded-xl hover:bg-transparent focus-visible:ring-inset"
              />
              <div className="flex h-full flex-col">
                <div className="relative shrink-0">
                  <PvCover item={item} />
                  <span className="bg-background/90 absolute right-2 bottom-2 rounded border px-1.5 py-0.5 text-[10px] tabular-nums">
                    {formatPvDuration(item.metadata?.duration)}
                  </span>
                </div>
                <div className="flex min-w-0 flex-col gap-2 p-3">
                  <h2 className="line-clamp-2 text-sm font-medium" title={item.name}>
                    {item.name}
                  </h2>
                  <p className="text-muted-foreground truncate text-xs">
                    {item.gameNameCn || item.gameName}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline">
                      {getPvCategoryLabel(item.metadata?.category ?? 'uncategorized')}
                    </Badge>
                    {PV_FILTERS.map(({ key, label }) => {
                      const value = item.metadata?.[key]
                      return value ? (
                        <Badge
                          key={key}
                          variant="outline"
                          title={`${label}：${value}`}
                          className="max-w-full"
                        >
                          <span className="truncate">{value}</span>
                        </Badge>
                      ) : null
                    })}
                  </div>
                </div>
              </div>
            </Card>
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
