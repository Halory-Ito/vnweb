import { FilesIcon, FolderIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

import type { PvCategoryFilter } from '../lib/pv-library'

type CategoryCounts = {
  total: number
  uncategorized: number
  byCategory: Record<string, number>
}

type Props = {
  categories: string[]
  category: PvCategoryFilter
  counts: CategoryCounts
  onChange: (category: PvCategoryFilter) => void
}

export function PvCategoryList({ categories, category, counts, onChange }: Props) {
  if (categories.length === 0) return null

  const options = [
    { value: null as PvCategoryFilter, label: '全部 PV', count: counts.total },
    ...categories.map((name) => ({
      value: name as PvCategoryFilter,
      label: name,
      count: counts.byCategory[name] ?? 0,
    })),
    ...(counts.uncategorized > 0
      ? [{ value: '' as PvCategoryFilter, label: '未分类', count: counts.uncategorized }]
      : []),
  ]

  return (
    <nav aria-label="PV 分类" className="max-h-full min-w-0 overflow-y-auto md:border-r md:pr-3">
      <p className="text-muted-foreground mb-2 hidden px-2 text-xs font-medium md:block">分类</p>
      <ul className="flex flex-nowrap gap-1 overflow-x-auto pb-1 md:flex-col md:overflow-visible md:pb-0">
        {options.map(({ value, label, count }) => (
          <li
            key={value === null ? 'all' : `category:${value}`}
            className="shrink-0 md:max-w-full md:min-w-0 md:shrink"
          >
            <Button
              type="button"
              size="sm"
              variant={category === value ? 'outline' : 'ghost'}
              aria-pressed={category === value}
              onClick={() => onChange(value)}
              className="justify-between gap-2 md:w-full"
            >
              <span className="flex min-w-0 items-center gap-1.5">
                {value === null ? (
                  <FilesIcon className="shrink-0" />
                ) : (
                  <FolderIcon className="shrink-0" />
                )}
                <span className="truncate" title={label}>
                  {label}
                </span>
              </span>
              <span className="text-muted-foreground shrink-0 text-[11px] tabular-nums">
                {count}
              </span>
            </Button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
