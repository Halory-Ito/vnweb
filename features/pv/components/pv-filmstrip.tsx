'use client'

import { ChevronLeftIcon, ChevronRightIcon, Loader2Icon, PencilIcon, PlayIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useRef } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getHostname, getYouTubeCover } from '@/features/pv/lib/pv-utils'
import { cn } from '@/lib/utils'

import type { PvItem } from '../types'
import type { WheelEvent } from 'react'

type PvFilmstripProps = {
  items: PvItem[]
  totalCount: number
  hasMore: boolean
  activeId: number | null
  isRefetching: boolean
  onSelect: (item: PvItem) => void
  onLoadMore: () => void
  onEdit: (item: PvItem) => void
  onDelete: (item: PvItem) => void
}

function SprocketRow() {
  return (
    <div className="flex items-center gap-3 overflow-hidden px-3 py-1.5 opacity-45">
      {Array.from({ length: 36 }).map((_, idx) => (
        <span
          key={idx}
          className="border-border bg-muted/60 h-2 w-3.5 shrink-0 rounded-[2px] border"
        />
      ))}
    </div>
  )
}

export function PvFilmstrip({
  items,
  totalCount,
  hasMore,
  activeId,
  isRefetching,
  onSelect,
  onLoadMore,
  onEdit,
  onDelete,
}: PvFilmstripProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    if (!scrollRef.current || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return
    scrollRef.current.scrollLeft += e.deltaY
  }

  const scrollByAmount = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const offset = direction === 'left' ? -520 : 520
    scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' })
  }

  return (
    <div className="relative rounded-2xl border-2">
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">胶片选集带</span>
          <Badge variant="outline" className="rounded-full text-[11px]">
            {items.length} / {totalCount} 卷
          </Badge>
          {isRefetching ? (
            <span className="text-muted-foreground flex items-center gap-1 text-xs">
              <Loader2Icon className="size-3 animate-spin" />
              更新中
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="icon-xs"
            onClick={() => scrollByAmount('left')}
            aria-label="向左滚动"
            className="rounded-full"
          >
            <ChevronLeftIcon className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-xs"
            onClick={() => scrollByAmount('right')}
            aria-label="向右滚动"
            className="rounded-full"
          >
            <ChevronRightIcon className="size-3.5" />
          </Button>
        </div>
      </div>

      <SprocketRow />

      <div
        ref={scrollRef}
        onWheel={handleWheel}
        className="flex gap-3.5 overflow-x-auto px-4 py-2"
      >
        {items.map((item, idx) => {
          const isActive = item.id === activeId
          const cover = getYouTubeCover(item.url) || item.gameCover || item.gameBg
          const gameTitle = item.gameNameCn || item.gameName || '未关联游戏'

          return (
            <div
              key={item.id}
              className={cn(
                'group relative w-56 shrink-0 overflow-hidden rounded-xl border-2 transition-all sm:w-64',
                isActive
                  ? 'border-primary bg-primary/5 -translate-y-1 shadow-md'
                  : 'border-border/70 bg-background/50 hover:border-primary/50 hover:-translate-y-0.5',
              )}
            >
              <button
                type="button"
                onClick={() => onSelect(item)}
                className="block w-full cursor-pointer text-left"
              >
                <div className="bg-muted relative aspect-video w-full overflow-hidden border-b">
                  {cover ? (
                    <img
                      src={cover}
                      alt={item.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="text-muted-foreground flex h-full w-full items-center justify-center">
                      <PlayIcon className="size-6" />
                    </div>
                  )}
                  <span className="bg-background/80 absolute top-2 left-2 rounded-full border px-2 py-0.5 font-mono text-[10px] backdrop-blur-xs">
                    #{String(idx + 1).padStart(2, '0')}
                  </span>
                </div>

                <div className="space-y-1 p-2.5">
                  <p className={cn('truncate text-sm font-medium', isActive && 'text-primary')}>
                    {item.name}
                  </p>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-muted-foreground truncate">{gameTitle}</span>
                    <span className="text-muted-foreground/80 shrink-0 font-mono text-[10px]">
                      {getHostname(item.url)}
                    </span>
                  </div>
                </div>
              </button>

              <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon-xs"
                  aria-label="编辑"
                  className="bg-background/85 rounded-full backdrop-blur-xs"
                  onClick={() => onEdit(item)}
                >
                  <PencilIcon className="size-3" />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon-xs"
                  aria-label="删除"
                  className="bg-background/85 rounded-full backdrop-blur-xs"
                  onClick={() => onDelete(item)}
                >
                  <Trash2Icon className="size-3" />
                </Button>
              </div>
            </div>
          )
        })}

        {hasMore ? (
          <button
            type="button"
            onClick={onLoadMore}
            className="border-border/80 bg-muted/20 hover:border-primary/60 hover:bg-muted/40 flex w-44 shrink-0 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 text-center transition-colors sm:w-48"
          >
            <div className="bg-background flex size-10 items-center justify-center rounded-full border">
              <PlusIcon className="size-4" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-medium">加载更多胶片</p>
              <p className="text-muted-foreground text-[11px]">
                剩余 {totalCount - items.length} 卷
              </p>
            </div>
          </button>
        ) : null}
      </div>

      <SprocketRow />
    </div>
  )
}
