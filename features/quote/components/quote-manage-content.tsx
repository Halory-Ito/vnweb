'use client'

import { Loader2Icon, SparklesIcon } from 'lucide-react'

import { QuoteNoteCard } from '@/features/quote/components/quote-note-card'

import type { QuoteManageItem } from '@/types'

type QuoteManageContentProps = {
  items: QuoteManageItem[]
  isLoading: boolean
  isRefetching: boolean
  onEdit: (item: QuoteManageItem) => void
  onDelete: (item: QuoteManageItem) => void
}

export function QuoteManageContent({
  items,
  isLoading,
  isRefetching,
  onEdit,
  onDelete,
}: QuoteManageContentProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-14">
        <Loader2Icon className="text-muted-foreground size-7 animate-spin" />
        <p className="text-muted-foreground text-xs">正在翻开回忆手账...</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center">
        <div className="mb-3 flex size-14 items-center justify-center rounded-full border border-rose-300/60 bg-rose-50/50 text-rose-500 dark:border-rose-400/30 dark:bg-rose-950/20">
          <SparklesIcon className="size-6" />
        </div>
        <p className="text-sm font-medium">(｡•́︿•̀｡) 还没有贴上台词便利贴</p>
        <p className="text-muted-foreground mt-1 text-xs">
          点击上方“新增摘录”，把心动的台词收藏进手账吧
        </p>
      </div>
    )
  }

  return (
    <div className="relative pt-2">
      {isRefetching ? (
        <div className="bg-background/85 absolute top-0 right-2 z-20 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs shadow-xs backdrop-blur-xs">
          <Loader2Icon className="size-3 animate-spin" />
          更新中
        </div>
      ) : null}

      <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4">
        {items.map((item) => (
          <QuoteNoteCard key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </div>
  )
}
