'use client'

import { PlusIcon, RotateCcwIcon, SearchIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'

type SongSearchToolbarProps = {
  keywordInput: string
  onKeywordInputChange: (val: string) => void
  onSearch: () => void
  onReset: () => void
  onCreate: () => void
}

export function SongSearchToolbar({
  keywordInput,
  onKeywordInputChange,
  onSearch,
  onReset,
  onCreate,
}: SongSearchToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <InputGroup className="flex-1 sm:w-64 sm:flex-initial">
          <InputGroupInput
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSearch()
            }}
            onChange={(e) => onKeywordInputChange(e.target.value)}
            value={keywordInput}
            placeholder="搜索歌曲名称..."
          />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
        </InputGroup>

        <Button type="button" variant="outline" className="rounded-full" onClick={onReset}>
          <RotateCcwIcon />
          重置
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={onCreate} variant="outline" className="rounded-full">
          <PlusIcon />
          <span>添加歌曲</span>
        </Button>
      </div>
    </div>
  )
}
