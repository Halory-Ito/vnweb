import {
  BackupSettingsProvider,
  ExportSection,
  GameSaveSection,
  ImportSection,
  LocalBackupSection,
  SyncServerPanel,
} from '@/features/backup'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '备份设置',
}

export default function BackupPage() {
  return (
    <BackupSettingsProvider>
      <div className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">同步服务器</h2>
          <SyncServerPanel />
        </div>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">本地备份</h2>
          <GameSaveSection />
          <LocalBackupSection />
          <ExportSection />
          <ImportSection />
        </div>
      </div>
    </BackupSettingsProvider>
  )
}
