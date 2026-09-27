'use client'

import { FolderUpIcon, Loader2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

import type { WebDAVTaskProgress } from '@/features/backup/webdav-api'

type Props = {
  isUploading: boolean
  uploadProgress: WebDAVTaskProgress | null
  uploadBackup: () => Promise<boolean>
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

export function WebDAVUploadCard({ isUploading, uploadProgress, uploadBackup }: Props) {
  const percent =
    uploadProgress && uploadProgress.total > 0
      ? Math.min(100, Math.round((uploadProgress.uploaded / uploadProgress.total) * 100))
      : 0

  return (
    <div className="dark:border-input dark:bg-input/20 space-y-6 rounded-xl border p-6">
      <div>
        <p className="text-base font-semibold">上传备份</p>
        <p className="text-muted-foreground mt-1 text-sm">
          将本地的游戏存档目录和 local.db 数据库上传到 WebDAV
          服务器，每次上传会生成一个带时间戳的备份。
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">立即上传</p>
          <p className="text-muted-foreground text-xs">上传内容：游戏存档目录、local.db 文件</p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={isUploading}
          onClick={() => void uploadBackup()}
        >
          {isUploading ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <FolderUpIcon className="size-4" />
          )}
          {isUploading ? '上传中...' : '立即上传'}
        </Button>
      </div>

      {isUploading && uploadProgress && (
        <div className="space-y-2">
          <div className="text-muted-foreground flex items-center justify-between text-xs">
            <span className="truncate">{uploadProgress.currentFile || '准备中...'}</span>
            <span>
              {formatSize(uploadProgress.uploaded)} / {formatSize(uploadProgress.total)}（{percent}
              %）
            </span>
          </div>
          <Progress value={percent} />
          <p className="text-muted-foreground text-xs">{uploadProgress.message}</p>
        </div>
      )}
    </div>
  )
}
