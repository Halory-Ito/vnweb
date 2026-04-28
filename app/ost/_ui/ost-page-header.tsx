'use client'

import { SearchIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

type OstPageHeaderProps = {
  onCreate: () => void
}

export function OstPageHeader({ onCreate }: OstPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">OST 管理</h1>
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:justify-end">
        <Button type="button" onClick={onCreate} variant="outline">
          <SearchIcon className="size-4" />
          添加 OST
        </Button>
      </div>
    </div>
  )
}
