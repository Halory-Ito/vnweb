import { ArrowDownIcon, ArrowUpIcon, ListOrderedIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import type { useLibraryGameSort } from '../hooks/use-library-game-sort'

type LibraryGameSortProps = Omit<ReturnType<typeof useLibraryGameSort>, 'items'>

export default function LibraryGameSort({
  field,
  order,
  sortOptions,
  changeField,
  toggleOrder,
}: LibraryGameSortProps) {
  const ascending = order === 'asc'

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="shrink-0">
          <ListOrderedIcon />
          排序
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="flex w-56 max-w-[calc(100vw-1.5rem)] items-center gap-2 p-2"
      >
        <Select value={field} onValueChange={changeField}>
          <SelectTrigger aria-label="排序依据" className="min-w-0 flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {sortOptions.map(({ field, label }) => (
                <SelectItem key={field} value={field}>
                  {label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          aria-label={ascending ? '当前升序，切换为降序' : '当前降序，切换为升序'}
          onClick={toggleOrder}
        >
          {ascending ? <ArrowUpIcon /> : <ArrowDownIcon />}
        </Button>
      </PopoverContent>
    </Popover>
  )
}
