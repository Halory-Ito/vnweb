import { FilterIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import GameHeaderSelectFilter from '@/features/game/components/game-header-select-filter'

import type { useLibraryGameFilters } from '../hooks/use-library-game-filters'

export type LibraryGameFilterProps = Pick<
  ReturnType<typeof useLibraryGameFilters>,
  'activeCount' | 'fields'
>

export default function LibraryGameFilter({ activeCount, fields }: LibraryGameFilterProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="shrink-0"
          aria-label={`筛选游戏（已选 ${activeCount} 项）`}
        >
          <FilterIcon />
          {activeCount ? `筛选 (${activeCount})` : '筛选'}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="flex w-64 max-w-[calc(100vw-1.5rem)] flex-col gap-2">
        {fields.map((field) => (
          <GameHeaderSelectFilter key={field.label} {...field} />
        ))}
      </PopoverContent>
    </Popover>
  )
}
