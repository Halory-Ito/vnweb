'use client'

import { PlusIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type PvSearchToolbarProps = {
  keywordInput: string
  onKeywordInputChange: (value: string) => void
  onSearch: () => void
  onCreate: () => void
}

export function PvSearchToolbar({
  keywordInput,
  onKeywordInputChange,
  onSearch,
  onCreate,
}: PvSearchToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* 搜索框 */}
      <div className="relative flex-1 sm:max-w-md">
        <Input
          className="pr-4 pl-10"
          placeholder="搜索游戏名 / PV 名称 / 链接"
          value={keywordInput}
          onChange={(event) => onKeywordInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              onSearch()
            }
          }}
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="text-muted-foreground absolute top-1/2 left-3.5 min-h-4 max-w-4 min-w-4 -translate-y-1/2"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </div>

      {/* 新增按钮 */}
      <Button type="button" onClick={onCreate} variant="outline">
        <PlusIcon />
        新增 PV
      </Button>
    </div>
  )
}