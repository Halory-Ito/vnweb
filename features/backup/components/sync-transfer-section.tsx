'use client'

import { FolderDownIcon, FolderUpIcon, Loader2Icon, RefreshCwIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSyncServer } from '@/features/backup/hooks/use-sync-server'

type TransferState = Pick<
  ReturnType<typeof useSyncServer>,
  | 'activeConfig'
  | 'isUploading'
  | 'uploadProgress'
  | 'uploadBackup'
  | 'backupList'
  | 'isLoadingBackups'
  | 'loadBackups'
  | 'selectedBackup'
  | 'setSelectedBackup'
  | 'setDownloadConfirmOpen'
>

export function SyncTransferSection({
  activeConfig,
  isUploading,
  uploadProgress,
  uploadBackup,
  backupList,
  isLoadingBackups,
  loadBackups,
  selectedBackup,
  setSelectedBackup,
  setDownloadConfirmOpen,
}: TransferState) {
  return (
    <>
      <section className="dark:border-input dark:bg-input/20 space-y-4 rounded-xl border p-6">
        <h2 className="text-base font-semibold">上传备份</h2>
        <div className="flex min-h-8 items-center justify-between gap-3">
          <span className="text-sm font-medium">立即上传</span>
          <Button
            variant="outline"
            disabled={isUploading || !activeConfig}
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
          <p className="text-muted-foreground truncate text-sm">
            {uploadProgress.currentFile || '准备中...'}
          </p>
        )}
      </section>

      <section className="dark:border-input dark:bg-input/20 space-y-4 rounded-xl border p-6">
        <h2 className="text-base font-semibold">下载备份</h2>
        <div className="flex min-h-8 flex-wrap items-center justify-between gap-3">
          <Select
            value={selectedBackup ?? ''}
            onValueChange={(name) => setSelectedBackup(name || null)}
            disabled={isLoadingBackups || backupList.length === 0}
          >
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue
                placeholder={
                  isLoadingBackups ? '加载中...' : backupList.length === 0 ? '暂无备份' : '选择备份'
                }
              />
            </SelectTrigger>
            <SelectContent className="w-(--radix-select-trigger-width)">
              <SelectGroup>
                {backupList.map((backup) => (
                  <SelectItem key={backup.name} value={backup.name}>
                    {backup.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={isLoadingBackups}
              onClick={() => void loadBackups()}
            >
              <RefreshCwIcon className={`size-4 ${isLoadingBackups ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="outline"
              disabled={!selectedBackup || !activeConfig}
              onClick={() => setDownloadConfirmOpen(true)}
            >
              <FolderDownIcon className="size-4" />
              下载
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
