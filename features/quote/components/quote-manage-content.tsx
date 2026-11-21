'use client'

import { Loader2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { EmptyArtwork } from '@/components/ui/empty-artwork'
import { QuoteNoteCard } from '@/features/quote/components/quote-note-card'
import { useQuoteColumns } from '@/features/quote/hooks/use-quote-columns'
import { useQuoteLoadMore } from '@/features/quote/hooks/use-quote-load-more'

import type { QuoteManageItem } from '@/types'

type QuoteManageContentProps = {
  items: QuoteManageItem[]
  isLoading: boolean
  isRefetching: boolean
  isError: boolean
  onRetry: () => unknown
  hasNextPage: boolean
  onLoadMore: () => unknown
  isLoadingMore: boolean
  hasLoadMoreError: boolean
  onEdit: (item: QuoteManageItem) => void
  onDelete: (item: QuoteManageItem) => void
}

export function QuoteManageContent({
  items,
  isLoading,
  isRefetching,
  isError,
  onRetry,
  hasNextPage,
  onLoadMore,
  isLoadingMore,
  hasLoadMoreError,
  onEdit,
  onDelete,
}: QuoteManageContentProps) {
  const columns = useQuoteColumns(items)
  const sentinel = useQuoteLoadMore(
    hasNextPage && !isRefetching && !isLoadingMore && !hasLoadMoreError,
    onLoadMore,
  )

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-14">
        <Loader2Icon className="text-muted-foreground size-7 animate-spin" />
        <p className="text-muted-foreground text-xs">正在翻开回忆手账...</p>
      </div>
    )
  }

  if (isError && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border p-12">
        <p className="text-muted-foreground text-sm">摘录加载失败</p>
        <Button variant="outline" onClick={() => void onRetry()}>
          重试
        </Button>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center">
        <EmptyArtwork className="mb-3" />
        <p className="text-sm font-medium">还没有贴上台词便利贴</p>
        <p className="text-muted-foreground mt-1 text-xs">
          点击上方“新增摘录”，把心动的台词收藏进手账吧
        </p>
      </div>
    )
  }

  return (
    <div className="relative pt-3">
      {isRefetching ? (
        <p
          role="status"
          className="bg-background/85 absolute top-0 right-2 z-20 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs shadow-xs backdrop-blur-xs"
        >
          <Loader2Icon className="size-3 animate-spin" />
          更新中
        </p>
      ) : null}

      <div className="flex items-start gap-5">
        {columns.map((columnItems, columnIndex) => (
          <div key={columnIndex} className="flex min-w-0 flex-1 flex-col gap-5">
            {columnItems.map((item) => (
              <QuoteNoteCard key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </div>
        ))}
      </div>

      {hasNextPage ? (
        <div ref={sentinel} className="mt-5 flex min-h-12 justify-center pb-4">
          <Button
            variant="outline"
            size="sm"
            disabled={isLoadingMore || isRefetching}
            onClick={() => void onLoadMore()}
          >
            {isLoadingMore ? <Loader2Icon className="animate-spin" /> : null}
            {isLoadingMore ? '加载中' : hasLoadMoreError ? '重试加载' : '加载更多摘录'}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
