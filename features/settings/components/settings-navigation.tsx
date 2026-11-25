'use client'

import Link from 'next/link'
import { useSelectedLayoutSegment } from 'next/navigation'

import { tabsListVariants } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

const links = [
  { segment: 'appearance', label: '外观' },
  { segment: 'theme', label: '主题' },
  { segment: 'memory', label: '回忆' },
  { segment: 'backup', label: '备份' },
  { segment: 'sync', label: '平台' },
  { segment: 'about', label: '关于' },
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
            aria-current={segment === target ? 'page' : undefined}
            className={cn(
              'text-foreground/60 focus-visible:ring-ring/50 dark:text-muted-foreground inline-flex h-full items-center justify-center rounded-md border border-transparent px-2 text-sm font-medium whitespace-nowrap transition-[color,background-color] outline-none focus-visible:ring-2 motion-reduce:transition-none',
              'hover:bg-background hover:text-foreground dark:hover:bg-input/30 dark:hover:text-foreground',
              'aria-[current=page]:bg-background aria-[current=page]:text-foreground dark:aria-[current=page]:bg-input/30 dark:aria-[current=page]:text-foreground',
              'in-[html:not([data-borderless])]:hover:shadow-sm in-[html:not([data-borderless])]:aria-[current=page]:shadow-sm dark:in-[html:not([data-borderless])]:hover:border-input dark:in-[html:not([data-borderless])]:aria-[current=page]:border-input',
            )}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
