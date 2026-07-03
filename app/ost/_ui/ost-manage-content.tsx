'use client'

import { ImageIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { toDisplayDate } from './utils'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

import type { OstItem } from './types'

type OstManageContentProps = {
  items: OstItem[]
  isLoading: boolean
  isRefetching: boolean
  onEdit: (item: OstItem) => void
  onDelete: (item: OstItem) => void
}

export function OstManageContent({
  items,
  isLoading,
  isRefetching,
  onEdit,
  onDelete,
}: OstManageContentProps) {
  const router = useRouter()

  return (
    <div className="flex flex-col gap-4">
      <div className="text-muted-foreground flex items-center text-sm font-medium">
        <span className="bg-secondary text-secondary-foreground flex h-5 items-center rounded-full px-2.5 text-xs">
          {items.length} 记录
        </span>
        {isRefetching && (
          <span className="ml-2 animate-pulse text-xs opacity-70">
            Refreshing...
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 p-1">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <div className="px-1 py-1">
                <Skeleton className="mx-auto h-4 w-full" />
                <Skeleton className="mx-auto mt-2 h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-muted-foreground flex min-h-75 items-center justify-center text-sm">
          暂无数据
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative flex flex-col p-1 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="relative w-full">
                <div
                  className="relative aspect-square w-full cursor-pointer overflow-hidden rounded-lg shadow-lg transition-all duration-300 group-hover:shadow-2xl"
                  onClick={() => {
                    router.push(`/ost/${item.id}`)
                  }}
                >
                  <div className="from-primary/20 to-primary/5 absolute -inset-4 bg-linear-to-br opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-40" />

                  {item.cover ? (
                    <img
                      src={item.cover}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="from-secondary/50 to-muted flex h-full w-full items-center justify-center bg-linear-to-br">
                      <ImageIcon className="text-muted-foreground/30 size-12 transition-transform duration-500 group-hover:scale-110" />
                    </div>
                  )}

                  <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-white/10 transition-all duration-300 group-hover:ring-2 group-hover:ring-white/20" />
                </div>
              </div>

              <div className="mt-2.5 w-full px-1">
                <h3
                  className="group-hover:text-primary truncate text-center text-sm leading-tight font-medium tracking-wide transition-colors"
                  title={item.name}
                >
                  {item.name}
                </h3>
                <p
                  className="text-muted-foreground mt-1 truncate text-center text-[11px]"
                  title={item.gameNameCn || item.gameName}
                >
                  {item.gameNameCn || item.gameName}
                </p>
              </div>

              <div className="absolute top-2 right-2 z-10 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                <Button
                  variant="secondary"
                  size="icon"
                  className="size-7 rounded-full shadow-md backdrop-blur-sm hover:scale-110"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(item)
                  }}
                  title="编辑"
                >
                  <PencilIcon className="size-3.5" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  className="size-7 rounded-full shadow-md backdrop-blur-sm hover:scale-110"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(item)
                  }}
                  title="删除"
                >
                  <Trash2Icon className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
