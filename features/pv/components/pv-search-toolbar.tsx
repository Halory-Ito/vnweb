'use client'

import { PlusIcon, RotateCcwIcon, SearchIcon, SlidersHorizontalIcon } from 'lucide-react'

import { PV_LIBRARY_FILTERS } from '../lib/pv-library'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import type { PvFilterKey, PvFilters } from '../lib/pv-library'

type Props = {
  keyword: string
  filters: PvFilters
  activeFilterCount: number
  options: Record<PvFilterKey, string[]>
  total: number
  onSearch: (keyword: string) => void
  onFilter: (key: PvFilterKey, value: string) => void
  onResetFilters: () => void
  onCreate: () => void
}

export function PvSearchToolbar({
  keyword,
  filters,
  activeFilterCount,
  options,
  total,
  onSearch,
  onFilter,
  onResetFilters,
  onCreate,
}: Props) {
  const availableFilters = PV_LIBRARY_FILTERS.filter(
    ({ key }) => options[key].length > 0 || Boolean(filters[key]),
  )

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 items-center gap-3 sm:max-w-lg">
        <div className="relative min-w-0 flex-1">
          <SearchIcon
            aria-hidden="true"
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
          />
          <Input
            aria-label="搜索 PV"
            className="pr-4 pl-10"
            placeholder="搜索游戏、PV 名称或链接"
            value={keyword}
            onChange={(event) => onSearch(event.target.value)}
          />
        </div>
        <span className="text-muted-foreground hidden shrink-0 text-xs tabular-nums sm:inline">
          共 {total} 条
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {availableFilters.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline">
                <SlidersHorizontalIcon />
                筛选
                {activeFilterCount > 0 && (
                  <Badge variant="outline" className="ml-0.5 px-1.5 py-0 text-[11px] tabular-nums">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">筛选条件</span>
                {activeFilterCount > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={onResetFilters}
                    className="text-muted-foreground"
                  >
                    <RotateCcwIcon className="size-3" />
                    重置
                  </Button>
                )}
              </div>
              <div className="grid gap-2.5">
                {availableFilters.map(({ key, label }) => (
                  <div
                    key={key}
                    className="grid grid-cols-[3.25rem_minmax(0,1fr)] items-center gap-2"
                  >
                    <span className="text-muted-foreground text-xs">{label}</span>
                    <Select
                      value={filters[key] ? `value:${filters[key]}` : 'all'}
                      onValueChange={(value) =>
                        onFilter(key, value === 'all' ? '' : value.slice(6))
                      }
                    >
                      <SelectTrigger aria-label={`筛选${label}`} className="h-8 w-full">
                        <SelectValue>{filters[key] || `全部${label}`}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="all">全部{label}</SelectItem>
                          {options[key].map((option) => (
                            <SelectItem key={option} value={`value:${option}`}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {activeFilterCount > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="text-muted-foreground"
          >
            <RotateCcwIcon className="size-3.5" />
            重置筛选
          </Button>
        )}

        <Button type="button" variant="outline" className="shrink-0" onClick={onCreate}>
          <PlusIcon />
          新增 PV
        </Button>
      </div>
    </div>
  )
}
