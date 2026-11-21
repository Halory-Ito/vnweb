'use client'

import { useMemo, useSyncExternalStore } from 'react'

import { distributeQuoteColumns } from '@/features/quote/lib/quote-masonry'

import type { QuoteManageItem } from '@/types'

const COLUMN_QUERIES = ['(min-width: 1280px)', '(min-width: 1024px)', '(min-width: 640px)'] as const

function getColumnCountSnapshot(): number {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 1
  }
  if (window.matchMedia(COLUMN_QUERIES[0]).matches) return 4
  if (window.matchMedia(COLUMN_QUERIES[1]).matches) return 3
  if (window.matchMedia(COLUMN_QUERIES[2]).matches) return 2
  return 1
}

function getServerColumnCountSnapshot(): number {
  return 1
}

function subscribeColumnCount(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => {}
  }

  const mediaQueries = COLUMN_QUERIES.map((query) => window.matchMedia(query))
  for (const mql of mediaQueries) {
    mql.addEventListener('change', onStoreChange)
  }

  return () => {
    for (const mql of mediaQueries) {
      mql.removeEventListener('change', onStoreChange)
    }
  }
}

/**
 * 按响应式断点将摘录列表稳定分配到多列瀑布流中。
 */
export function useQuoteColumns(items: QuoteManageItem[]): QuoteManageItem[][] {
  const columnCount = useSyncExternalStore(
    subscribeColumnCount,
    getColumnCountSnapshot,
    getServerColumnCountSnapshot,
  )

  return useMemo(() => distributeQuoteColumns(items, columnCount), [items, columnCount])
}
