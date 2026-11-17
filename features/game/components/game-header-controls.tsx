'use client'

import { FilterIcon, XIcon } from 'lucide-react'

import { GAME_HEADER_DATE_FILTERS } from '../data/game-header-filters'
import { useGameHeaderFilters } from '../hooks/use-game-header-filters'
import GameHeaderSelectFilter from './game-header-select-filter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export default function GameHeaderControls() {
  const { search, setSearch, filter, selectFilters, changeFilter, resetFilters } =
    useGameHeaderFilters()

  return (
    <div className="flex w-full min-w-0 items-center gap-2">
      <Input
        className="h-10 min-w-0 flex-1 md:h-9"
        type="search"
        placeholder="搜索游戏"
        aria-label="搜索游戏"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="size-10 shrink-0 md:size-9"
            aria-label="筛选游戏"
          >
            <FilterIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="max-h-[min(80dvh,var(--radix-popover-content-available-height))] w-96 max-w-[calc(100vw-24px)] overflow-y-auto"
        >
          <div className="space-y-3">
            <div className="text-sm font-medium">筛选游戏</div>
            {GAME_HEADER_DATE_FILTERS.map(({ key, label }) => (
              <div key={key} className="flex min-w-0 items-end gap-2">
                <label className="min-w-0 flex-1 space-y-1 text-xs">
                  <span>{label}</span>
                  <Input
                    type="date"
                    className="min-w-0"
                    value={filter[key]}
                    onChange={(event) => changeFilter(key, event.target.value)}
                  />
                </label>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  aria-label={`清除${label}筛选`}
                  onClick={() => changeFilter(key, '')}
                >
                  <XIcon className="size-4" />
                </Button>
              </div>
            ))}
            {selectFilters.map(({ key, label, options }) => (
              <GameHeaderSelectFilter
                key={key}
                label={label}
                value={filter[key]}
                options={options}
                onChange={(value) => changeFilter(key, value)}
              />
            ))}
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={resetFilters}>
                重置筛选
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
