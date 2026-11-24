'use client'

import { Trash2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { BackupConfirmDialog } from '@/features/backup/components/backup-confirm-dialog'
import { useBackupSettingsContext } from '@/features/backup/context/backup-settings-context'
import { formatBackupSize } from '@/features/backup/lib/format-backup-size'

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
      <section
        aria-labelledby="local-backup-settings"
        className="dark:border-input dark:bg-input/20 space-y-4 rounded-xl border p-4 sm:p-6"
      >
        <div className="flex min-h-8 items-center justify-between gap-3">
          <h2 id="local-backup-settings" className="text-base font-semibold">
            本地备份
          </h2>
          <Button
            type="button"
            variant="outline"
            disabled={isCreatingBackup}
            onClick={() => void handleCreateLocalBackup()}
          >
            {isCreatingBackup ? '备份中...' : '立即备份'}
          </Button>
        </div>

        {isLoadingBackups ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : localBackups.length === 0 ? (
          <p className="text-muted-foreground text-sm">暂无备份</p>
        ) : (
          <div className="divide-border/60 max-h-64 divide-y overflow-y-auto">
            {localBackups.map((backup) => (
              <div
                key={backup.id}
                className="flex min-h-12 items-center justify-between gap-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{backup.name}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {backup.createdAt ? new Date(backup.createdAt).toLocaleString() : '未知'} ·{' '}
                    {formatBackupSize(backup.size)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setRestoreTargetId(backup.id)}
                  >
                    恢复
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label={`删除备份 ${backup.name}`}
                    className="text-muted-foreground hover:text-destructive hover:border-destructive/40"
                    onClick={() => setDeleteTargetId(backup.id)}
                  >
                    <Trash2Icon className="size-3.5" />
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
