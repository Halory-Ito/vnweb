'use client'

import { RefreshCwIcon } from 'lucide-react'

import { SYNC_CATEGORY_COLORS } from './sync-upload-category-row'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatBackupSize } from '@/features/backup/lib/format-backup-size'
import { cn } from '@/lib/utils'

import type { SelectedSyncCategorySegment } from '@/lib/backup-content'

type Props = {
  totalSize: number
  totalFiles: number
  subtitle?: string
  targetServerName?: string
  isFetching: boolean
  onRefresh: () => void
  segments: Array<Pick<SelectedSyncCategorySegment, 'key' | 'label' | 'size'>>
}

export function SyncPreviewOverviewCard({
  totalSize,
  totalFiles,
  subtitle,
  targetServerName,
  isFetching,
  onRefresh,
  segments,
}: Props) {
  return (
    <div className="border-border/70 space-y-3 rounded-lg border p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-semibold tabular-nums">
              {formatBackupSize(totalSize)}
            </span>
            <span className="text-muted-foreground text-xs">共 {totalFiles} 个文件</span>
          </div>
          {subtitle ? (
            <p className="text-muted-foreground truncate text-xs tabular-nums">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-1.5">
          {targetServerName ? (
            <Badge variant="outline" className="max-w-44 truncate text-xs font-normal">
              {targetServerName}
            </Badge>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="icon-xs"
            aria-label="重新统计"
            disabled={isFetching}
            onClick={onRefresh}
          >
            <RefreshCwIcon className={cn('size-3.5', isFetching && 'animate-spin')} />
          </Button>
        </div>
      </div>

      <div className="bg-muted flex h-2 w-full overflow-hidden rounded-full">
        {totalSize > 0
          ? segments
              .filter((segment) => segment.size > 0)
              .map((segment) => (
                <div
                  key={segment.key}
                  style={{
                    width: `${(segment.size / totalSize) * 100}%`,
                    backgroundColor: SYNC_CATEGORY_COLORS[segment.key],
                  }}
                  title={`${segment.label}: ${formatBackupSize(segment.size)}`}
                />
              ))
          : null}
      </div>
    </div>
  )
}
