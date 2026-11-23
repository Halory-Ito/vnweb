'use client'

import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { BackupConfirmDialog } from '@/features/backup/components/backup-confirm-dialog'
import { SyncConfigDialog } from '@/features/backup/components/sync-config-dialog'
import { SyncTransferSection } from '@/features/backup/components/sync-transfer-section'
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
    uploadBackup,
    backupList,
    isLoadingBackups,
    loadBackups,
    selectedBackup,
    setSelectedBackup,
    downloadConfirmOpen,
    setDownloadConfirmOpen,
    isDownloading,
    downloadBackup,
    activeConfig,
  } = useSyncServer()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editData, setEditData] = useState<SyncServerConfig | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SyncServerConfig | null>(null)

  return (
    <>
      <section className="dark:border-input dark:bg-input/20 space-y-4 rounded-xl border p-6">
        <div className="flex min-h-8 items-center justify-between gap-3">
          <h2 className="text-base font-semibold">服务器配置</h2>
          <Button
            variant="outline"
            size="sm"
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
          <p className="text-muted-foreground text-sm">加载中...</p>
        ) : configs.length === 0 ? (
          <p className="text-muted-foreground text-sm">暂无配置</p>
        ) : (
          <div className="divide-border divide-y">
            {configs.map((config) => (
              <div key={config.id} className="flex min-h-12 items-center gap-3 py-2">
                <Switch
                  checked={config.enabled}
                  onCheckedChange={() => {
                    if (!config.enabled) void saveConfig({ ...config, enabled: true })
                  }}
                  aria-label={`启用 ${config.name}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate text-sm font-medium">
                    {config.name}
                    <span className="text-muted-foreground text-xs font-normal">
                      {config.provider === 's3' ? 'S3' : 'WebDAV'}
                    </span>
                  </p>
                  <p className="text-muted-foreground truncate text-sm">
                    {config.provider === 's3'
                      ? `${config.bucket}@${config.endpoint}`
                      : config.server}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditData(config)
                    setDialogOpen(true)
                  }}
                >
                  <PencilIcon className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(config)}>
                  <Trash2Icon className="size-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      <SyncTransferSection
        activeConfig={activeConfig}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        uploadBackup={uploadBackup}
        backupList={backupList}
        isLoadingBackups={isLoadingBackups}
        loadBackups={loadBackups}
        selectedBackup={selectedBackup}
        setSelectedBackup={setSelectedBackup}
        setDownloadConfirmOpen={setDownloadConfirmOpen}
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

      <BackupConfirmDialog
        open={downloadConfirmOpen}
        onOpenChange={setDownloadConfirmOpen}
        title="下载备份"
        description="下载将覆盖当前的本地文件，确定要继续吗？"
        loading={isDownloading}
        onConfirm={() => {
          void downloadBackup().then((ok) => ok && setDownloadConfirmOpen(false))
        }}
      />
    </>
  )
}
