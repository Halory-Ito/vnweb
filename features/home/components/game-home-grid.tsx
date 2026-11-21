import { cn } from '@/lib/utils'

import type { ReactNode } from 'react'

export default function GameHomeGrid({
  children,
  folders,
}: {
  children: ReactNode
  folders?: boolean
}) {
  return (
    <div
      className={cn(
        'grid min-w-0 gap-2.5 @min-[36rem]/library:gap-4',
        folders
          ? 'grid-cols-[repeat(auto-fill,minmax(min(100%,clamp(8rem,30cqw,12rem)),1fr))]'
          : 'grid-cols-[repeat(auto-fill,minmax(min(100%,clamp(8rem,22cqw,9.5rem)),1fr))]',
      )}
    >
      {children}
    </div>
  )
}
