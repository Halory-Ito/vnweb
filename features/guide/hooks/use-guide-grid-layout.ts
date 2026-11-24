'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export const GUIDE_GRID_ROW_OPTIONS = ['1', '2', '3', '4', '5'] as const
export const GUIDE_GRID_COLUMN_OPTIONS = ['2', '3', '4', '5', '6', '7', '8'] as const

const DEFAULT_ROW_COUNT = 2
const DEFAULT_COLUMN_COUNT = 5

export function getResponsiveColumnCount(width: number): number {
  if (width >= 1360) return 8
  if (width >= 1100) return 6
  if (width >= 860) return 5
  if (width >= 640) return 4
  if (width >= 460) return 3
  return 2
}

export function useGuideGridLayout() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [responsiveColumns, setResponsiveColumns] = useState(DEFAULT_COLUMN_COUNT)
  const [customColumns, setCustomColumns] = useState<number | null>(null)
  const [rowCount, setRowCountState] = useState(DEFAULT_ROW_COUNT)
  const [page, setPage] = useState(1)

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const update = () => {
      const next = getResponsiveColumnCount(element.clientWidth)
      setResponsiveColumns((prev) => (prev === next ? prev : next))
    }

    update()

    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const columnCount = customColumns ?? responsiveColumns
  const pageSize = rowCount * columnCount

  const setRowCount = useCallback((nextRows: number) => {
    setRowCountState(nextRows)
    setPage(1)
  }, [])

  const setColumnCount = useCallback((nextColumns: number) => {
    setCustomColumns(nextColumns)
    setPage(1)
  }, [])

  return {
    containerRef,
    rowCount,
    columnCount,
    pageSize,
    page,
    setPage,
    setRowCount,
    setColumnCount,
  }
}
