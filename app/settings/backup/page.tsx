import BackupSettingsContent from './backup-settings-content'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '备份设置',
}

export default function BackupPage() {
  return <BackupSettingsContent />
}
