'use client'

import { FolderDownIcon, FolderUpIcon, Loader2Icon, RefreshCwIcon } from 'lucide-react'

import { SyncProgressCard } from './sync-progress-card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useSyncServer } from '@/features/backup/hooks/use-sync-server'
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
  | 'downloadProgress'
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
  downloadProgress,
}: TransferState) {
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
          disabled={isUploading || isDownloading || !activeConfig}
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
        <SyncProgressCard progress={uploadProgress} fallbackLabel="正在打包压缩..." />
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
              isUploading ||
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

      {isDownloading ? (
        <SyncProgressCard progress={downloadProgress} fallbackLabel="准备拉取远端备份..." />
      ) : null}
    </div>
  )
}
