'use client'

import { useRecentVisitLayout } from '../hooks/use-recent-visit-layout'
import { RECENT_VISIT_GRID_CLASS } from '../lib/recent-visit-layout'
import { Skeleton } from '@/components/ui/skeleton'

import type { Ref } from 'react'

type RecentVisitsSkeletonProps = {
  count?: number
  containerRef?: Ref<HTMLDivElement>
}

export default function RecentVisitsSkeleton({ count, containerRef }: RecentVisitsSkeletonProps) {
  const layout = useRecentVisitLayout()

  return (
    <div className="w-full space-y-4" aria-hidden="true">
      <Skeleton className="h-11 w-full rounded-xl" />
      <div ref={containerRef ?? layout.containerRef} className={RECENT_VISIT_GRID_CLASS}>
        {Array.from({ length: count ?? layout.columnCount }).map((_, index) => (
          <div key={index} className="w-full space-y-1.5">
            <Skeleton className="aspect-3/4 w-full rounded-lg" />
            <Skeleton className="mx-auto h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  )
}
