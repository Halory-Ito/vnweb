'use client'

import { useSyncExternalStore } from 'react'

import {
  getServerAppSettingsSnapshot,
  readAppSettings,
  subscribeAppSettings,
  type AppSettings,
} from '@/lib/settings/app-settings'

export function useAppSettings(): AppSettings {
  return useSyncExternalStore(subscribeAppSettings, readAppSettings, getServerAppSettingsSnapshot)
}
