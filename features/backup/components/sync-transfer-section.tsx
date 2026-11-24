'use client'

import { FolderDownIcon, FolderUpIcon, Loader2Icon, RefreshCwIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { useSyncServer } from '@/features/backup/hooks/use-sync-server'
import { formatBackupSize } from '@/features/backup/lib/format-backup-size'
import { cn } from '@/lib/utils'

type TransferState = Pick<
  ReturnType<typeof useSyncServer>,
  | 'activeConfig'
  | 'isUploading'
  | 'uploadProgress'
  | 'setUploadPreviewOpen'
  | 'remoteStatus'
  | 'isCheckingRemote'
  | 'checkRemoteBackup'
  | 'setDownloadPreviewOpen'
  | 'isDownloading'
>

function formatRemoteDate(value?: string): string {
  if (!value) return '检测到远端备份'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString()
}

export function SyncTransferSection({
  activeConfig,
  isUploading,
  uploadProgress,
  setUploadPreviewOpen,
  remoteStatus,
  isCheckingRemote,
  checkRemoteBackup,
  setDownloadPreviewOpen,
  isDownloading,
}: TransferState) {
  const percent =
    uploadProgress?.percent ??
    (uploadProgress?.total
      ? Math.min(100, Math.round((uploadProgress.uploaded / uploadProgress.total) * 100))
      : 0)

  const remoteDateText = !activeConfig
    ? '未启用服务器'
    : isCheckingRemote
      ? '检测中...'
      : remoteStatus?.exists
        ? formatRemoteDate(remoteStatus.backupDate)
        : '暂无远端备份'

  return (
    <div className="border-border/60 space-y-4 border-t pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Label>上传备份</Label>
        <Button
          type="button"
          variant="outline"
          disabled={isUploading || !activeConfig}
          onClick={() => setUploadPreviewOpen(true)}
        >
          {isUploading ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <FolderUpIcon className="size-4" />
          )}
          {isUploading ? '上传中...' : '立即上传'}
        </Button>
      </div>

      {isUploading ? (
        <div className="border-border/70 space-y-2.5 rounded-lg border p-3">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="truncate font-medium">
              {uploadProgress?.currentCategory
                ? `正在上传：${uploadProgress.currentCategory}`
                : '准备上传...'}
            </span>
            <span className="text-muted-foreground shrink-0 tabular-nums">{percent}%</span>
          </div>
          <Progress value={percent} />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {(uploadProgress?.categories ?? []).map((category) => (
                <Badge key={category} variant="outline" className="text-[11px] font-normal">
                  {category}
                </Badge>
              ))}
            </div>
            {uploadProgress?.total ? (
              <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                {formatBackupSize(uploadProgress.uploaded)} /{' '}
                {formatBackupSize(uploadProgress.total)}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <Label>下载备份</Label>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-xs tabular-nums sm:text-sm">
            {remoteDateText}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="检测远端备份日期"
            disabled={isCheckingRemote || !activeConfig}
            onClick={() => void checkRemoteBackup()}
          >
            <RefreshCwIcon className={cn('size-4', isCheckingRemote && 'animate-spin')} />
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={
              !activeConfig ||
              isCheckingRemote ||
              isDownloading ||
              (remoteStatus !== null && !remoteStatus.exists)
            }
            onClick={() => setDownloadPreviewOpen(true)}
          >
            {isDownloading ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <FolderDownIcon className="size-4" />
            )}
            {isDownloading ? '拉取中...' : '下载'}
          </Button>
        </div>
      </div>
    </div>
  )
}
