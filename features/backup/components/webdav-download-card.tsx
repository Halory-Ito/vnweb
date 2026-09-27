'use client'

import { FolderDownIcon, Loader2Icon, RefreshCwIcon } from 'lucide-react'
import { useEffect } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'

import type { RemoteBackupInfo } from '@/features/backup/webdav-api'

type Props = {
  backupList: RemoteBackupInfo[]
  isLoadingBackups: boolean
  loadBackups: () => Promise<RemoteBackupInfo[]>
  selectedBackup: string | null
  setSelectedBackup: (name: string | null) => void
  downloadConfirmOpen: boolean
  setDownloadConfirmOpen: (open: boolean) => void
  isDownloading: boolean
  downloadBackup: () => Promise<boolean>
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

export function WebDAVDownloadCard({
  backupList,
  isLoadingBackups,
  loadBackups,
  selectedBackup,
  setSelectedBackup,
  downloadConfirmOpen,
  setDownloadConfirmOpen,
  isDownloading,
  downloadBackup,
}: Props) {
  // 首次加载时拉取远程备份列表
  useEffect(() => {
    void loadBackups()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDownload = async () => {
    const success = await downloadBackup()
    if (success) {
      setDownloadConfirmOpen(false)
    }
  }

  return (
    <div className="dark:border-input dark:bg-input/20 space-y-6 rounded-xl border p-6">
      <div>
        <p className="text-base font-semibold">下载备份</p>
        <p className="text-muted-foreground mt-1 text-sm">
          从 WebDAV 服务器下载备份并覆盖本地文件。下载前会自动备份当前的 游戏存档目录和 local.db
          文件。
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-sm font-medium">远程备份</p>
            <NativeSelect
              className="w-full"
              value={selectedBackup || ''}
              onChange={(e) => setSelectedBackup(e.target.value || null)}
              disabled={isLoadingBackups || backupList.length === 0}
            >
              <NativeSelectOption value="" disabled>
                {isLoadingBackups
                  ? '加载中...'
                  : backupList.length === 0
                    ? '暂无远程备份'
                    : '请选择备份'}
              </NativeSelectOption>
              {backupList.map((backup) => (
                <NativeSelectOption key={backup.name} value={backup.name}>
                  {backup.name}（{formatSize(backup.size)}）
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={isLoadingBackups}
            onClick={() => void loadBackups()}
            title="刷新备份列表"
          >
            <RefreshCwIcon className={`size-4 ${isLoadingBackups ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={!selectedBackup || isLoadingBackups}
            onClick={() => setDownloadConfirmOpen(true)}
          >
            {isDownloading ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <FolderDownIcon className="size-4" />
            )}
            {isDownloading ? '下载中...' : '下载并覆盖'}
          </Button>
        </div>
      </div>

      {/* 下载确认对话框 */}
      <Dialog open={downloadConfirmOpen} onOpenChange={setDownloadConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认下载备份</DialogTitle>
            <DialogDescription>
              下载将覆盖当前的游戏存档目录和 local.db 文件。下载前会自动将当前文件备份到
              Documents/VnBackups 目录，确定要继续吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isDownloading}
              onClick={() => setDownloadConfirmOpen(false)}
            >
              取消
            </Button>
            <Button type="button" disabled={isDownloading} onClick={() => void handleDownload()}>
              {isDownloading ? '下载中...' : '确认下载'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
