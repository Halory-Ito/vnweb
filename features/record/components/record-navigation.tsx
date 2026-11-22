'use client'

import Link from 'next/link'
import { useSelectedLayoutSegment } from 'next/navigation'

import { tabsListVariants } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

const links = [
  { segment: 'overview', label: '总览' },
  { segment: 'year', label: '年报' },
  { segment: 'month', label: '月报' },
  { segment: 'export', label: '导出报告' },
  { segment: 'data', label: '数据' },
] as const

export default function RecordNavigation() {
  const segment = useSelectedLayoutSegment()

  return (
    <nav aria-label="游戏记录" className="max-w-full overflow-x-auto">
      <div className={cn(tabsListVariants(), 'h-9 gap-1 dark:bg-transparent')}>
        {links.map(({ segment: target, label }) => (
          <Link
            key={target}
            href={`/record/${target}`}
            prefetch={false}
            aria-current={segment === target ? 'page' : undefined}
            className={cn(
              'text-foreground/60 focus-visible:ring-ring/50 dark:text-muted-foreground inline-flex h-full items-center justify-center rounded-md border border-transparent px-2 text-sm font-medium whitespace-nowrap transition-[color,background-color,border-color,box-shadow] outline-none focus-visible:ring-2',
              'hover:bg-background hover:text-foreground hover:shadow-sm dark:hover:border-input dark:hover:bg-input/30 dark:hover:text-foreground',
              'aria-[current=page]:bg-background aria-[current=page]:text-foreground aria-[current=page]:shadow-sm dark:aria-[current=page]:border-input dark:aria-[current=page]:bg-input/30 dark:aria-[current=page]:text-foreground',
            )}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
