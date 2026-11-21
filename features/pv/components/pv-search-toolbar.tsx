'use client'

import { PlusIcon, SearchIcon } from 'lucide-react'

import { PV_LIBRARY_FILTERS } from '../lib/pv-library'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  options: Record<PvFilterKey, string[]>
  onSearch: (keyword: string) => void
  onFilter: (key: PvFilterKey, value: string) => void
  onCreate: () => void
}

export function PvSearchToolbar({
  keyword,
  filters,
  options,
  onSearch,
  onFilter,
  onCreate,
}: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <SearchIcon
            aria-hidden="true"
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          />
          <Input
            aria-label="搜索 PV"
            className="pl-9"
            placeholder="搜索游戏、PV 名称或链接"
            value={keyword}
            onChange={(event) => onSearch(event.target.value)}
          />
        </div>
        <Button type="button" variant="outline" className="shrink-0" onClick={onCreate}>
          <PlusIcon />
          新增 PV
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {PV_LIBRARY_FILTERS.map(({ key, label }) => (
          <Select
            key={key}
            value={filters[key] ? `value:${filters[key]}` : 'all'}
            onValueChange={(value) => onFilter(key, value === 'all' ? '' : value.slice(6))}
          >
            <SelectTrigger aria-label={`筛选${label}`} className="max-w-40 rounded-full">
              <SelectValue>{filters[key] ? `${label}：${filters[key]}` : label}</SelectValue>
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
        ))}
      </div>
    </div>
  )
}
