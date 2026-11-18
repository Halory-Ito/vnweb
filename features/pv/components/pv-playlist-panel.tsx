'use client'

import { Loader2Icon, PencilIcon, PlayIcon, Trash2Icon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getHostname, getYouTubeCover } from '@/features/pv/lib/pv-utils'
import { cn } from '@/lib/utils'

import type { PvItem } from '../types'

type PvPlaylistPanelProps = {
  items: PvItem[]
  activeId: number | null
  isRefetching: boolean
  onSelect: (item: PvItem) => void
  onEdit: (item: PvItem) => void
  onDelete: (item: PvItem) => void
}

export function PvPlaylistPanel({
  items,
  activeId,
  isRefetching,
  onSelect,
  onEdit,
  onDelete,
}: PvPlaylistPanelProps) {
  return (
    <div className="relative flex flex-col rounded-2xl border-2 p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">放映选集</h3>
          <Badge variant="outline" className="rounded-full text-[11px]">
            {items.length} 部
          </Badge>
        </div>
        {isRefetching ? (
          <span className="text-muted-foreground flex items-center gap-1 text-xs">
            <Loader2Icon className="size-3 animate-spin" />
            更新中
          </span>
        ) : null}
      </div>

      <div className="max-h-[540px] space-y-2 overflow-y-auto pr-1">
        {items.map((item) => {
          const isActive = item.id === activeId
          const cover = getYouTubeCover(item.url)
          const gameTitle = item.gameNameCn || item.gameName || '未关联游戏'

          return (
            <div
              key={item.id}
              className={cn(
                'group flex items-center gap-3 rounded-xl border p-2 transition-all',
                isActive
                  ? 'border-primary/70 bg-primary/5 shadow-xs'
                  : 'border-border/60 bg-background/40 hover:border-border hover:bg-muted/35',
              )}
            >
              <button
                type="button"
                onClick={() => onSelect(item)}
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
              >
                <div className="bg-muted relative aspect-video w-24 shrink-0 overflow-hidden rounded-lg border">
                  {cover ? (
                    <img
                      src={cover}
                      alt={item.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="text-muted-foreground flex h-full w-full items-center justify-center">
                      <PlayIcon className="size-4" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'absolute inset-0 flex items-center justify-center bg-black/35 transition-opacity',
                      isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                    )}
                  >
                    <PlayIcon className="size-4 fill-white text-white" />
                  </div>
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <p className={cn('truncate text-sm font-medium', isActive && 'text-primary')}>
                    {item.name}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">{gameTitle}</p>
                  <p className="text-muted-foreground/80 truncate font-mono text-[11px]">
                    {getHostname(item.url)}
                  </p>
                </div>
              </button>

              <div className="flex shrink-0 items-center gap-0.5 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:focus-within:opacity-100">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label="编辑"
                  onClick={() => onEdit(item)}
                >
                  <PencilIcon className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label="删除"
                  onClick={() => onDelete(item)}
                >
                  <Trash2Icon className="size-3.5" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
