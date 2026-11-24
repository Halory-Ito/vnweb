'use client'

import { FolderUpIcon } from 'lucide-react'
import { useState } from 'react'

import { SyncUploadPreviewSummary } from './sync-upload-preview-summary'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useSyncUploadPreview } from '@/features/backup/hooks/use-sync-upload-preview'
import { computeSelectedSyncSummary, DEFAULT_BACKUP_CONTENT_OPTIONS } from '@/lib/backup-content'

import type { BackupContentOptions } from '@/types'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetServerName?: string
  isUploading: boolean
  onConfirmUpload: (options: BackupContentOptions) => void
}

export function SyncUploadPreviewDialog({
  open,
  onOpenChange,
  targetServerName,
  isUploading,
  onConfirmUpload,
}: Props) {
  const { summary, isLoading, isFetching, isError, errorMessage, refetch } =
    useSyncUploadPreview(open)
  const [draftOptions, setDraftOptions] = useState<BackupContentOptions | null>(null)

  const activeOptions = draftOptions ?? summary?.options ?? DEFAULT_BACKUP_CONTENT_OPTIONS
  const computed = summary ? computeSelectedSyncSummary(summary, activeOptions) : null

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setDraftOptions(null)
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[85dvh] w-full max-w-[calc(100%-2rem)] flex-col overflow-hidden sm:max-w-xl">
        <DialogHeader className="shrink-0">
          <DialogTitle>上传备份统计</DialogTitle>
          <DialogDescription className="sr-only">
            确认并勾选即将上传的数据分类与大小
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1 py-1">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-lg" />
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-11 w-full rounded-lg" />
              ))}
            </div>
          ) : isError || !summary ? (
            <div className="border-border/70 flex items-center justify-between gap-3 rounded-lg border p-3.5">
              <p className="text-destructive text-sm">{errorMessage || '获取统计失败'}</p>
              <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
                重试
              </Button>
            </div>
          ) : (
            <SyncUploadPreviewSummary
              summary={summary}
              options={activeOptions}
              onChangeOptions={setDraftOptions}
              targetServerName={targetServerName}
              isFetching={isFetching}
              onRefresh={() => void refetch()}
            />
          )}
        </div>

        <DialogFooter className="shrink-0">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            取消
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isLoading || isFetching || isError || !computed?.canUpload || isUploading}
            onClick={() => {
              const selectedOptions = activeOptions
              handleOpenChange(false)
              onConfirmUpload(selectedOptions)
            }}
          >
            <FolderUpIcon className="size-4" />
            确认上传
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
