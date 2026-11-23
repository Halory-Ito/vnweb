'use client'

import Link from 'next/link'
import { useSelectedLayoutSegment } from 'next/navigation'

import { tabsListVariants } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

const links = [
  { segment: 'appearance', label: '外观' },
  { segment: 'theme', label: '主题' },
  { segment: 'backup', label: '备份' },
  { segment: 'sync', label: '平台' },
] as const

export default function SettingsNavigation() {
  const segment = useSelectedLayoutSegment()

  return (
    <nav aria-label="系统设置" className="max-w-full overflow-x-auto">
      <div className={cn(tabsListVariants(), 'h-9 gap-1 dark:bg-transparent')}>
        {links.map(({ segment: target, label }) => (
          <Link
            key={target}
            href={`/settings/${target}`}
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
