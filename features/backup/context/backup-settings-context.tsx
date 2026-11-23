'use client'

import { createContext, useContext } from 'react'

import { useBackupSettings } from '@/features/backup/hooks/use-backup-settings'

type BackupSettingsValue = ReturnType<typeof useBackupSettings>

const BackupSettingsContext = createContext<BackupSettingsValue | null>(null)

export function BackupSettingsProvider({ children }: { children: React.ReactNode }) {
  const value = useBackupSettings()
  return <BackupSettingsContext.Provider value={value}>{children}</BackupSettingsContext.Provider>
}

export function useBackupSettingsContext() {
  const value = useContext(BackupSettingsContext)
  if (!value) {
    throw new Error('useBackupSettingsContext must be used within BackupSettingsProvider')
  }
  return value
}
