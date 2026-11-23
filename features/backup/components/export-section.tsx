'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useBackupSettingsContext } from '@/features/backup/context/backup-settings-context'

export function ExportSection() {
  const { isExporting, isExportingXlsx, handleExport, handleExportXlsx } =
    useBackupSettingsContext()

  return (
    <section className="dark:border-input dark:bg-input/20 space-y-4 rounded-xl border p-6">
      <h2 className="text-base font-semibold">导出备份</h2>
      <div className="flex min-h-8 items-center justify-between gap-3">
        <Label>导出 ZIP</Label>
        <Button variant="outline" disabled={isExporting} onClick={() => void handleExport()}>
          {isExporting ? '导出中...' : 'ZIP'}
        </Button>
      </div>
      <div className="flex min-h-8 items-center justify-between gap-3">
        <Label>导出 XLSX</Label>
        <Button
          variant="outline"
          disabled={isExportingXlsx}
          onClick={() => void handleExportXlsx()}
        >
          {isExportingXlsx ? '导出中...' : 'XLSX'}
        </Button>
      </div>
    </section>
  )
}
