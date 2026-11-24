'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useBackupSettingsContext } from '@/features/backup/context/backup-settings-context'

export function ImportSection() {
  const { isImporting, importFileInputRef, handleImportFileChange } = useBackupSettingsContext()

  return (
    <section
      aria-labelledby="import-backup-settings"
      className="dark:border-input dark:bg-input/20 space-y-4 rounded-xl border p-4 sm:p-6"
    >
      <h2 id="import-backup-settings" className="text-base font-semibold">
        导入备份
      </h2>
      <div className="flex min-h-9 items-center justify-between gap-3">
        <Label>导入 ZIP</Label>
        <div>
          <input
            ref={importFileInputRef}
            type="file"
            accept=".zip"
            className="hidden"
            onChange={(event) => void handleImportFileChange(event)}
          />
          <Button
            type="button"
            variant="outline"
            disabled={isImporting}
            onClick={() => importFileInputRef.current?.click()}
          >
            {isImporting ? '导入中...' : '导入'}
          </Button>
        </div>
      </div>
    </section>
  )
}
