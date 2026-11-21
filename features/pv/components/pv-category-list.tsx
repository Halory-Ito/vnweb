import { FilesIcon, FolderIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

import type { PvCategoryFilter } from '../lib/pv-library'

type Props = {
  categories: string[]
  category: PvCategoryFilter
  onChange: (category: PvCategoryFilter) => void
}

export function PvCategoryList({ categories, category, onChange }: Props) {
  const options = [
    { value: null, label: '全部 PV' },
    ...categories.map((name) => ({ value: name, label: name })),
    { value: '', label: '未分类' },
  ]

  return (
    <nav aria-label="PV 分类" className="max-h-full min-w-0 overflow-y-auto md:border-r md:pr-3">
      <p className="text-muted-foreground mb-2 hidden px-2 text-xs font-medium md:block">分类</p>
      <ul className="flex flex-wrap gap-1 md:flex-col">
        {options.map(({ value, label }) => (
          <li key={value === null ? 'all' : `category:${value}`} className="max-w-full min-w-0">
            <Button
              type="button"
              size="sm"
              variant={category === value ? 'outline' : 'ghost'}
              aria-pressed={category === value}
              onClick={() => onChange(value)}
              className="max-w-full justify-start md:w-full"
            >
              {value === null ? <FilesIcon /> : <FolderIcon />}
              <span className="truncate" title={label}>
                {label}
              </span>
            </Button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
