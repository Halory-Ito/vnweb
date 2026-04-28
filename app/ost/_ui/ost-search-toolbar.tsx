'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import type { GameOption } from './types'

type OstSearchToolbarProps = {
  keywordInput: string
  gameFilter: string
  gameOptions: GameOption[]
  onKeywordInputChange: (value: string) => void
  onGameFilterChange: (value: string) => void
  onSearch: () => void
  onReset: () => void
}

export function OstSearchToolbar({
  keywordInput,
  gameFilter,
  gameOptions,
  onKeywordInputChange,
  onGameFilterChange,
  onSearch,
  onReset,
}: OstSearchToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1 sm:max-w-md">
        <Input
          className="pr-4 pl-10"
          placeholder="搜索 OST 名称 / 游戏名"
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

      <div className="flex flex-1 flex-wrap items-center gap-3">
        <Select value={gameFilter} onValueChange={onGameFilterChange}>
          <SelectTrigger className="h-10 w-55">
            <SelectValue placeholder="按游戏筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部游戏</SelectItem>
            {gameOptions.map((game) => (
              <SelectItem key={game.id} value={game.id}>
                {game.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            className="h-10"
            onClick={onSearch}
          >
            搜索
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground h-10 transition-colors"
            onClick={onReset}
          >
            重置
          </Button>
        </div>
      </div>
    </div>
  )
}
