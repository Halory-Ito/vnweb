'use client'

import { Trash2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { BackupConfirmDialog } from '@/features/backup/components/backup-confirm-dialog'
import { useBackupSettingsContext } from '@/features/backup/context/backup-settings-context'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

export function LocalBackupSection() {
  const {
    isCreatingBackup,
    localBackups,
    isLoadingBackups,
    restoreTargetId,
    setRestoreTargetId,
    deleteTargetId,
    setDeleteTargetId,
    handleCreateLocalBackup,
    handleRestoreBackup,
    handleDeleteBackup,
  } = useBackupSettingsContext()

  return (
    <>
      <section className="dark:border-input dark:bg-input/20 space-y-4 rounded-xl border p-6">
        <div className="flex min-h-8 items-center justify-between gap-3">
          <h2 className="text-base font-semibold">本地备份</h2>
          <Button
            variant="outline"
            disabled={isCreatingBackup}
            onClick={() => void handleCreateLocalBackup()}
          >
            {isCreatingBackup ? '备份中...' : '立即备份'}
          </Button>
        </div>

        {isLoadingBackups ? (
          <p className="text-muted-foreground text-sm">加载中...</p>
        ) : localBackups.length === 0 ? (
          <p className="text-muted-foreground text-sm">暂无备份</p>
        ) : (
          <div className="divide-border max-h-64 divide-y overflow-y-auto">
            {localBackups.map((backup) => (
              <div
                key={backup.id}
                className="flex min-h-12 items-center justify-between gap-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{backup.name}</p>
                  <p className="text-muted-foreground truncate text-sm">
                    {backup.createdAt ? new Date(backup.createdAt).toLocaleString() : '未知'} ·{' '}
                    {formatSize(backup.size)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setRestoreTargetId(backup.id)}>
                    恢复
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteTargetId(backup.id)}>
                    <Trash2Icon className="size-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <BackupConfirmDialog
        open={!!restoreTargetId}
        onOpenChange={() => setRestoreTargetId(null)}
        title="恢复备份"
        description="恢复将替换当前数据且不可撤销，确定继续吗？"
        confirmLabel="恢复"
        onConfirm={() => void handleRestoreBackup()}
      />

      <BackupConfirmDialog
        open={!!deleteTargetId}
        onOpenChange={() => setDeleteTargetId(null)}
        title="删除备份"
        description="删除后无法恢复，确定删除吗？"
        confirmLabel="删除"
        destructive
        onConfirm={() => void handleDeleteBackup()}
      />
    </>
  )
}
