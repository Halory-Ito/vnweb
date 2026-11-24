'use client'

import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { BackupConfirmDialog } from '@/features/backup/components/backup-confirm-dialog'
import { SyncConfigDialog } from '@/features/backup/components/sync-config-dialog'
import { SyncDownloadPreviewDialog } from '@/features/backup/components/sync-download-preview-dialog'
import { SyncTransferSection } from '@/features/backup/components/sync-transfer-section'
import { SyncUploadPreviewDialog } from '@/features/backup/components/sync-upload-preview-dialog'
import { useSyncServer } from '@/features/backup/hooks/use-sync-server'

import type { SyncServerConfig } from '@/types'

export function SyncServerPanel() {
  const {
    configs,
    isLoadingConfigs,
    testingId,
    savingId,
    testConnection,
    saveConfig,
    deleteConfig,
    isUploading,
    uploadProgress,
    uploadPreviewOpen,
    setUploadPreviewOpen,
    uploadBackup,
    remoteStatus,
    isCheckingRemote,
    checkRemoteBackup,
    downloadPreviewOpen,
    setDownloadPreviewOpen,
    isDownloading,
    downloadBackup,
    activeConfig,
  } = useSyncServer()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editData, setEditData] = useState<SyncServerConfig | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SyncServerConfig | null>(null)

  return (
    <>
      <section
        aria-labelledby="sync-server-settings"
        className="dark:border-input dark:bg-input/20 space-y-4 rounded-xl border p-4 sm:p-6"
      >
        <div className="flex min-h-8 items-center justify-between gap-3">
          <h2 id="sync-server-settings" className="text-base font-semibold">
            同步服务器
          </h2>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setEditData(null)
              setDialogOpen(true)
            }}
          >
            <PlusIcon className="size-4" />
            新增
          </Button>
        </div>

        {isLoadingConfigs ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : configs.length === 0 ? (
          <p className="text-muted-foreground text-sm">暂无配置</p>
        ) : (
          <div className="divide-border/60 divide-y">
            {configs.map((config) => (
              <div key={config.id} className="flex min-h-12 items-center gap-3 py-2.5">
                <Switch
                  checked={config.enabled}
                  onCheckedChange={() => {
                    if (!config.enabled) void saveConfig({ ...config, enabled: true })
                  }}
                  aria-label={`启用 ${config.name}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{config.name}</p>
                    <Badge variant="outline" className="shrink-0 text-xs font-normal">
                      {config.provider === 's3' ? 'S3' : 'WebDAV'}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground truncate text-xs">
                    {config.provider === 's3'
                      ? `${config.bucket}@${config.endpoint}`
                      : config.server}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label={`编辑 ${config.name}`}
                    onClick={() => {
                      setEditData(config)
                      setDialogOpen(true)
                    }}
                  >
                    <PencilIcon className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label={`删除 ${config.name}`}
                    className="text-muted-foreground hover:text-destructive hover:border-destructive/40"
                    onClick={() => setDeleteTarget(config)}
                  >
                    <Trash2Icon className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <SyncTransferSection
          activeConfig={activeConfig}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          setUploadPreviewOpen={setUploadPreviewOpen}
          remoteStatus={remoteStatus}
          isCheckingRemote={isCheckingRemote}
          checkRemoteBackup={checkRemoteBackup}
          setDownloadPreviewOpen={setDownloadPreviewOpen}
          isDownloading={isDownloading}
        />
      </section>

      <SyncUploadPreviewDialog
        open={uploadPreviewOpen}
        onOpenChange={setUploadPreviewOpen}
        targetServerName={activeConfig?.name}
        isUploading={isUploading}
        onConfirmUpload={(options) => void uploadBackup(options)}
      />

      <SyncDownloadPreviewDialog
        open={downloadPreviewOpen}
        onOpenChange={setDownloadPreviewOpen}
        targetServerName={activeConfig?.name}
        isDownloading={isDownloading}
        onConfirmDownload={(backupName) => void downloadBackup(backupName)}
      />

      <SyncConfigDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editData={editData}
        testingId={testingId}
        savingId={savingId}
        onTest={testConnection}
        onSave={saveConfig}
      />

      <BackupConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="删除配置"
        description={`确定删除「${deleteTarget?.name}」吗？`}
        confirmLabel="删除"
        destructive
        onConfirm={() => {
          if (deleteTarget) void deleteConfig(deleteTarget.id)
          setDeleteTarget(null)
        }}
      />
    </>
  )
}
