'use client'

import { TextQuoteIcon, PlusIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

type QuotePageHeaderProps = {
  onCreate: () => void
}

export function QuotePageHeader({ onCreate }: QuotePageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 flex size-10 items-center justify-center rounded-lg">
          <TextQuoteIcon className="text-primary size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">台词摘录</h1>
          <p className="text-muted-foreground text-sm">记录和管理游戏中的经典台词</p>
        </div>
      </div>

      <Button type="button" onClick={onCreate}>
        <PlusIcon className="mr-2 size-4" />
        添加摘录
      </Button>
    </div>
  )
}
