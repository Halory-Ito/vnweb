'use client'

import {
  ArrowLeftRightIcon,
  PlusIcon,
  RotateCcwIcon,
  SearchIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'

type SongSearchToolbarProps = {
  keywordInput: string
  onKeywordInputChange: (val: string) => void
  onSearch: () => void
  onReset: () => void
  onCreate: () => void
  onConvert: () => void
}

export function SongSearchToolbar({
  keywordInput,
  onKeywordInputChange,
  onSearch,
  onReset,
  onCreate,
  onConvert,
}: SongSearchToolbarProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <InputGroup className="max-w-xs">
          <InputGroupInput
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSearch()
            }}
            onChange={(e) => onKeywordInputChange(e.target.value)}
            value={keywordInput}
            placeholder="搜索歌曲..."
          />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
        </InputGroup>

        <Button
          variant="outline"
          onClick={onReset}
          className="w-full sm:w-auto"
        >
          <RotateCcwIcon />
          重置
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={onConvert} variant={'outline'}>
          <ArrowLeftRightIcon />
          <span>转换信息</span>
        </Button>
        <Button onClick={onCreate} variant={'outline'}>
          <PlusIcon />
          <span>添加歌曲</span>
        </Button>
      </div>
    </div>
  )
}
