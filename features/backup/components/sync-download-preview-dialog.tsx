'use client'

import { FolderDownIcon } from 'lucide-react'

import { SyncDownloadPreviewSummary } from './sync-download-preview-summary'
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
import { useSyncDownloadPreview } from '@/features/backup/hooks/use-sync-download-preview'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetServerName?: string
  isDownloading: boolean
  onConfirmDownload: (backupName: string) => void
}

export function SyncDownloadPreviewDialog({
  open,
  onOpenChange,
  targetServerName,
  isDownloading,
  onConfirmDownload,
}: Props) {
  const { summary, isLoading, isFetching, isError, errorMessage, refetch } =
    useSyncDownloadPreview(open)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85dvh] w-full max-w-[calc(100%-2rem)] flex-col overflow-hidden sm:max-w-xl">
        <DialogHeader className="shrink-0">
          <DialogTitle>拉取远端备份统计</DialogTitle>
          <DialogDescription className="sr-only">
            确认远端备份日期、数据分类与待拉取文件大小
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1 py-1">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-18 w-full rounded-lg" />
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-11 w-full rounded-lg" />
              ))}
            </div>
          ) : isError || !summary ? (
            <div className="border-border/70 flex items-center justify-between gap-3 rounded-lg border p-3.5">
              <p className="text-destructive text-sm">{errorMessage || '获取远端统计失败'}</p>
              <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
                重试
              </Button>
            </div>
          ) : !summary.exists ? (
            <div className="border-border/70 rounded-lg border p-4 text-sm">
              <p className="text-muted-foreground">同步服务器中暂无可拉取的备份。</p>
            </div>
          ) : (
            <SyncDownloadPreviewSummary
              summary={summary}
              targetServerName={targetServerName}
              isFetching={isFetching}
              onRefresh={() => void refetch()}
            />
          )}
        </div>

        <DialogFooter className="shrink-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isLoading || isFetching || isError || !summary?.exists || isDownloading}
            onClick={() => {
              if (!summary?.backupName) return
              onOpenChange(false)
              onConfirmDownload(summary.backupName)
            }}
          >
            <FolderDownIcon className="size-4" />
            确认拉取
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
