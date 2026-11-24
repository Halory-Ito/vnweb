'use client'

import {
  DatabaseIcon,
  FilmIcon,
  Gamepad2Icon,
  type LucideIcon,
  MusicIcon,
  TypeIcon,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { formatBackupSize } from '@/features/backup/lib/format-backup-size'
import { cn } from '@/lib/utils'

import type { SelectedSyncCategorySegment } from '@/lib/backup-content'
import type { BackupContentOptions, SyncUploadPreviewSummary } from '@/types'

type NonImageCategoryKey = Exclude<SelectedSyncCategorySegment['key'], 'images'>

export const SYNC_CATEGORY_COLORS: Record<SelectedSyncCategorySegment['key'], string> = {
  database: 'var(--chart-1)',
  'game-saves': 'var(--chart-2)',
  images: 'var(--chart-3)',
  video: 'var(--chart-4)',
  audio: 'var(--chart-5)',
  font: 'var(--primary)',
}

const SIMPLE_MEDIA_ROWS: Array<{ key: 'video' | 'audio' | 'font'; icon: LucideIcon }> = [
  { key: 'video', icon: FilmIcon },
  { key: 'audio', icon: MusicIcon },
  { key: 'font', icon: TypeIcon },
]

export type SyncUploadCategoryRowItem = {
  key: NonImageCategoryKey
  label: string
  subtitle: string
  icon: LucideIcon
  checked: boolean
  disabled?: boolean
  requiredBadge?: boolean
  error?: boolean
  dimmed?: boolean
  size: number
  ariaLabel: string
  onCheckedChange?: (checked: boolean) => void
}

export function buildSyncUploadCategoryRows(
  summary: SyncUploadPreviewSummary,
  options: BackupContentOptions,
  onChangeOptions: (next: BackupContentOptions) => void,
) {
  const headRows: SyncUploadCategoryRowItem[] = [
    {
      key: 'database',
      label: summary.database.label,
      subtitle: summary.database.available
        ? `${summary.database.fileCount} 个文件`
        : summary.database.unavailableReason || '数据库文件不存在',
      icon: DatabaseIcon,
      checked: true,
      disabled: true,
      requiredBadge: true,
      error: !summary.database.available,
      size: summary.database.available ? summary.database.size : 0,
      ariaLabel: '数据库（必选）',
    },
    {
      key: 'game-saves',
      label: summary.gameSaves.label,
      subtitle: !options.gameSaves
        ? '已取消勾选'
        : summary.gameSaves.status === 'available'
          ? `${summary.gameSaves.fileCount} 个文件`
          : summary.gameSaves.unavailableReason || '不可用',
      icon: Gamepad2Icon,
      checked: options.gameSaves,
      error: options.gameSaves && summary.gameSaves.status === 'missing',
      dimmed: !options.gameSaves,
      size:
        options.gameSaves && summary.gameSaves.status === 'available' ? summary.gameSaves.size : 0,
      ariaLabel: '选择游戏存档',
      onCheckedChange: (checked) => onChangeOptions({ ...options, gameSaves: checked }),
    },
  ]

  const mediaRows: SyncUploadCategoryRowItem[] = SIMPLE_MEDIA_ROWS.map(({ key, icon }) => {
    const stat = summary[key]
    const checked = options[key]
    return {
      key,
      label: stat.label,
      subtitle: `${stat.fileCount} 个文件`,
      icon,
      checked,
      dimmed: !checked,
      size: checked ? stat.size : 0,
      ariaLabel: `选择${stat.label}`,
      onCheckedChange: (next) => onChangeOptions({ ...options, [key]: next }),
    }
  })

  return { headRows, mediaRows }
}

export function SyncUploadCategoryRow({
  row,
  totalSize,
}: {
  row: SyncUploadCategoryRowItem
  totalSize: number
}) {
  const Icon = row.icon
  const percent = totalSize > 0 ? Number(((row.size / totalSize) * 100).toFixed(1)) : 0

  return (
    <div className="flex min-h-12 items-center justify-between gap-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <Checkbox
          checked={row.checked}
          disabled={row.disabled}
          aria-label={row.ariaLabel}
          onCheckedChange={(checked) => row.onCheckedChange?.(checked === true)}
        />
        <span
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: SYNC_CATEGORY_COLORS[row.key] }}
        />
        <Icon className="text-muted-foreground size-4 shrink-0" />
        <div className={cn('min-w-0', row.dimmed && 'opacity-55')}>
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-medium">{row.label}</p>
            {row.requiredBadge ? (
              <Badge variant="outline" className="h-4 px-1.5 text-[10px] font-normal">
                必选
              </Badge>
            ) : null}
          </div>
          <p
            className={cn(
              'truncate text-xs',
              row.error ? 'text-destructive' : 'text-muted-foreground',
            )}
          >
            {row.subtitle}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-baseline gap-2 text-right tabular-nums">
        <span className={cn('text-sm font-medium', row.dimmed && 'opacity-55')}>
          {formatBackupSize(row.size)}
        </span>
        {totalSize > 0 && row.size > 0 ? (
          <span className="text-muted-foreground text-xs">{percent}%</span>
        ) : null}
      </div>
    </div>
  )
}
