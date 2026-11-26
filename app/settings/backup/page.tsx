import {
  BackupContentSection,
  BackupSettingsProvider,
  ExportSection,
  GameSaveSection,
  ImportSection,
  LocalBackupSection,
  PlatformImportSection,
  SyncServerPanel,
} from '@/features/backup'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '备份设置',
}

export default function BackupPage() {
  return (
    <BackupSettingsProvider>
      <div className="space-y-6">
        <SyncServerPanel />
        <BackupContentSection />
        <GameSaveSection />
        <LocalBackupSection />
        <ExportSection />
        <ImportSection />
        <PlatformImportSection />
      </div>
    </BackupSettingsProvider>
  )
}
