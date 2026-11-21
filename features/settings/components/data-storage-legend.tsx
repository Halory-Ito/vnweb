'use client'

import { formatResourceSize } from '../lib/data-resource-utils'

import type { ResourceChartDatum } from '../hooks/use-data-settings'
import type { LocalResourceSummary, ResourceCategory } from '../settings-api'

interface DataStorageLegendProps {
  items: ResourceChartDatum[]
  unusedSummary: LocalResourceSummary
  showUnusedRow: boolean
  colors: Record<ResourceCategory, string>
  onSelectUnused: () => void
}

export function DataStorageLegend({
  items,
  unusedSummary,
  showUnusedRow,
  colors,
  onSelectUnused,
}: DataStorageLegendProps) {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-2 text-xs sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.category} className="flex items-center justify-between gap-2">
          <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
            <span
              className="size-2.5 shrink-0 rounded-[2px]"
              style={{ backgroundColor: colors[item.category] }}
            />
            <span>{item.label}</span>
            <span className="text-muted-foreground">({item.count})</span>
          </div>
          <span className="text-muted-foreground whitespace-nowrap tabular-nums">
            {formatResourceSize(item.size)}
          </span>
        </div>
      ))}
      {showUnusedRow ? (
        <button
          type="button"
          onClick={onSelectUnused}
          className="hover:text-foreground col-span-full flex items-center justify-between gap-2 border-t pt-2 text-left transition-colors"
        >
          <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
            <span className="bg-muted-foreground/40 size-2.5 shrink-0 rounded-[2px]" />
            <span>未使用资源</span>
            <span className="text-muted-foreground">({unusedSummary.totalCount})</span>
          </div>
          <span className="text-muted-foreground whitespace-nowrap tabular-nums">
            {formatResourceSize(unusedSummary.totalSize)}
          </span>
        </button>
      ) : null}
    </div>
  )
}
