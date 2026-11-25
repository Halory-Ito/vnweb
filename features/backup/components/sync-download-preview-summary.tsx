'use client'

import {
  AlertTriangleIcon,
  ChevronDownIcon,
  DatabaseIcon,
  FilmIcon,
  Gamepad2Icon,
  ImageIcon,
  type LucideIcon,
  MusicIcon,
  SlidersHorizontalIcon,
  TypeIcon,
} from 'lucide-react'
import { useState } from 'react'

import { SyncPreviewOverviewCard } from './sync-preview-overview-card'
import { SYNC_CATEGORY_COLORS } from './sync-upload-category-row'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { formatBackupSize } from '@/features/backup/lib/format-backup-size'
import { cn } from '@/lib/utils'

import type {
  RemoteDownloadCategorySummary,
  SyncDownloadPreviewSummary as DownloadPreviewSummaryData,
} from '@/types'

const CATEGORY_ICONS: Record<RemoteDownloadCategorySummary['key'], LucideIcon> = {
  database: DatabaseIcon,
  settings: SlidersHorizontalIcon,
  'game-saves': Gamepad2Icon,
  images: ImageIcon,
  video: FilmIcon,
  audio: MusicIcon,
  font: TypeIcon,
}

type Props = {
  summary: DownloadPreviewSummaryData
  targetServerName?: string
  isFetching: boolean
  onRefresh: () => void
}

function calcPercent(part: number, total: number) {
  return total > 0 ? Number(((part / total) * 100).toFixed(1)) : 0
}

export function SyncDownloadPreviewSummary({
  summary,
  targetServerName,
  isFetching,
  onRefresh,
}: Props) {
  const [imagesExpanded, setImagesExpanded] = useState(true)
  const backupDateText = summary.backupDate
    ? new Date(summary.backupDate).toLocaleString()
    : '未知日期'
  const subtitle = summary.archiveSize
    ? `备份日期：${backupDateText} · 压缩包 ${formatBackupSize(summary.archiveSize)}`
    : `备份日期：${backupDateText}`

  return (
    <>
      <SyncPreviewOverviewCard
        totalSize={summary.totalSize}
        totalFiles={summary.totalFiles}
        subtitle={subtitle}
        targetServerName={targetServerName}
        isFetching={isFetching}
        onRefresh={onRefresh}
        segments={summary.categories}
      />

      <div className="border-border/70 divide-border/60 divide-y rounded-lg border px-3.5">
        {summary.categories.map((category) => {
          const Icon = CATEGORY_ICONS[category.key]
          const percent = calcPercent(category.size, summary.totalSize)
          const hasDetails = category.key === 'images' && summary.imageItems.length > 0

          const row = (
            <div className="flex min-h-10 items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: SYNC_CATEGORY_COLORS[category.key] }}
                />
                <Icon className="text-muted-foreground size-4 shrink-0" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{category.label}</p>
                  <p className="text-muted-foreground truncate text-xs tabular-nums">
                    {category.fileCount} 个文件
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 text-right tabular-nums">
                <span className="text-sm font-medium">{formatBackupSize(category.size)}</span>
                {summary.totalSize > 0 ? (
                  <span className="text-muted-foreground text-xs">{percent}%</span>
                ) : null}
                {hasDetails ? (
                  <CollapsibleTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-xs"
                      aria-label={imagesExpanded ? '收起图片明细' : '展开图片明细'}
                    >
                      <ChevronDownIcon
                        className={cn(
                          'size-3.5 transition-transform',
                          imagesExpanded && 'rotate-180',
                        )}
                      />
                    </Button>
                  </CollapsibleTrigger>
                ) : null}
              </div>
            </div>
          )

          if (!hasDetails) {
            return (
              <div key={category.key} className="py-2.5">
                {row}
              </div>
            )
          }

          return (
            <Collapsible
              key={category.key}
              open={imagesExpanded}
              onOpenChange={setImagesExpanded}
              className="py-2.5"
            >
              {row}
              <CollapsibleContent>
                <div className="border-border/50 mt-2 ml-6 space-y-1 border-l pb-1 pl-3">
                  {summary.imageItems.map((item) => (
                    <div
                      key={item.key}
                      className="flex min-h-6 items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate">{item.label}</span>
                        <span className="text-muted-foreground shrink-0 tabular-nums">
                          {item.fileCount} 个
                        </span>
                      </div>
                      <span className="shrink-0 font-medium tabular-nums">
                        {formatBackupSize(item.size)}
                      </span>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )
        })}
      </div>

      <div className="border-border/70 text-muted-foreground flex items-start gap-2 rounded-lg border px-3 py-2 text-xs">
        <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
        <span>
          {summary.hasGameSaves && !summary.gameSaveEnabled
            ? '本地未启用游戏存档备份，拉取时将跳过存档；其余内容会先备份本地旧文件后再覆盖。'
            : '拉取前将自动备份将被覆盖的本地文件，随后使用远端数据替换本地内容。'}
        </span>
      </div>
    </>
  )
}
