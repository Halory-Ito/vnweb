'use client'

import { useEffect, useState } from 'react'

import { RECENT_VISIT_INITIAL_COLUMNS } from '../lib/recent-visit-layout'

type RecentVisitLayout = {
  width: number
  gap: number
  columnCount: number
}

export function useRecentVisitLayout() {
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const [layout, setLayout] = useState<RecentVisitLayout>({
    width: 0,
    gap: 0,
    columnCount: RECENT_VISIT_INITIAL_COLUMNS,
  })

  useEffect(() => {
    if (!container) return

    const measure = () => {
      const styles = getComputedStyle(container)
      const width = container.getBoundingClientRect().width
      const gap = Number.parseFloat(styles.columnGap) || 0
      const minWidth = Number.parseFloat(styles.getPropertyValue('--recent-card-min-width')) || 174
      const columnCount = Math.max(1, Math.floor((width + gap) / (minWidth + gap)))

      setLayout((previous) =>
        previous.width === width && previous.gap === gap && previous.columnCount === columnCount
          ? previous
          : { width, gap, columnCount },
      )
    }

    const observer = new ResizeObserver(measure)
    observer.observe(container)
    window.addEventListener('resize', measure)
    measure()

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [container])

  return { ...layout, containerRef: setContainer }
}
