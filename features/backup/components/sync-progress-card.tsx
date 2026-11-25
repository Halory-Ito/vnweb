'use client'

import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { formatBackupSize } from '@/features/backup/lib/format-backup-size'

import type { SyncTaskProgress } from '@/features/backup/sync-server-api'

type Props = {
  progress: SyncTaskProgress | null
  fallbackLabel: string
}

export function SyncProgressCard({ progress, fallbackLabel }: Props) {
  const percent =
    progress?.percent ??
    (progress?.total
      ? Math.min(
          100,
          Math.round(((progress.transferred ?? progress.uploaded) / progress.total) * 100),
        )
      : 0)

  const transferred = progress?.transferred ?? progress?.uploaded ?? 0
  const showTransferBytes =
    Boolean(progress?.total) &&
    (progress?.stage === 'uploading' || progress?.stage === 'downloading' || !progress?.stage)

  return (
    <div className="border-border/70 space-y-2.5 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="truncate font-medium">{progress?.message || fallbackLabel}</span>
        <span className="text-muted-foreground shrink-0 tabular-nums">{percent}%</span>
      </div>
      <Progress value={percent} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {(progress?.categories ?? []).map((category) => (
            <Badge key={category} variant="outline" className="text-[11px] font-normal">
              {category}
            </Badge>
          ))}
        </div>
        {showTransferBytes && progress?.total ? (
          <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
            {formatBackupSize(transferred)} / {formatBackupSize(progress.total)}
          </span>
        ) : null}
      </div>
    </div>
  )
}
