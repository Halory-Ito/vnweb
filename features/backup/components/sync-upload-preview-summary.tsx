'use client'

import { AlertCircleIcon } from 'lucide-react'

import { SyncPreviewOverviewCard } from './sync-preview-overview-card'
import {
  buildSyncUploadCategoryRows,
  SYNC_CATEGORY_COLORS,
  SyncUploadCategoryRow,
} from './sync-upload-category-row'
import { SyncUploadImageCategoryRow } from './sync-upload-image-category-row'
import { computeSelectedSyncSummary, setAllImagesSelected } from '@/lib/backup-content'

import type { BackupContentOptions, SyncUploadPreviewSummary as PreviewSummaryData } from '@/types'

type Props = {
  summary: PreviewSummaryData
  options: BackupContentOptions
  onChangeOptions: (next: BackupContentOptions) => void
  targetServerName?: string
  isFetching: boolean
  onRefresh: () => void
}

export function SyncUploadPreviewSummary({
  summary,
  options,
  onChangeOptions,
  targetServerName,
  isFetching,
  onRefresh,
}: Props) {
  const computed = computeSelectedSyncSummary(summary, options)
  const { headRows, mediaRows } = buildSyncUploadCategoryRows(summary, options, onChangeOptions)

  return (
    <>
      <SyncPreviewOverviewCard
        totalSize={computed.totalSize}
        totalFiles={computed.totalFiles}
        targetServerName={targetServerName}
        isFetching={isFetching}
        onRefresh={onRefresh}
        segments={computed.segments}
      />

      <div className="border-border/70 divide-border/60 divide-y rounded-lg border px-3.5">
        {headRows.map((row) => (
          <SyncUploadCategoryRow key={row.key} row={row} totalSize={computed.totalSize} />
        ))}

        <SyncUploadImageCategoryRow
          summary={summary.images}
          selectedImages={options.images}
          selectedSize={computed.selectedImagesSize}
          selectedFiles={computed.selectedImagesFiles}
          totalSelectedSize={computed.totalSize}
          color={SYNC_CATEGORY_COLORS.images}
          onToggleAll={(checked) => onChangeOptions(setAllImagesSelected(options, checked))}
          onToggleItem={(key, checked) =>
            onChangeOptions({
              ...options,
              images: { ...options.images, [key]: checked },
            })
          }
        />

        {mediaRows.map((row) => (
          <SyncUploadCategoryRow key={row.key} row={row} totalSize={computed.totalSize} />
        ))}
      </div>

      {!computed.canUpload && computed.blockingReason ? (
        <div className="border-destructive/40 bg-destructive/5 text-destructive flex items-center gap-2 rounded-lg border px-3 py-2 text-xs">
          <AlertCircleIcon className="size-4 shrink-0" />
          <span>{computed.blockingReason}</span>
        </div>
      ) : null}
    </>
  )
}
