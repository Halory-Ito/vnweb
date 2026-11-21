'use client'

import { useAtomValue } from 'jotai'
import { useEffect } from 'react'

import { borderlessAtom } from './use-layout-visibility'
import {
  applyFontSettingsToDocument,
  FONT_SETTINGS_EVENT,
  FONT_SETTINGS_STORAGE_KEY,
  readFontSettings,
} from '@/lib/settings/font-settings'
import {
  applyGlassSettingsToDocument,
  GLASS_SETTINGS_EVENT,
  GLASS_SETTINGS_STORAGE_KEY,
  readGlassSettings,
} from '@/lib/settings/glass-settings'

export function useAppAppearance() {
  const borderless = useAtomValue(borderlessAtom)

  useEffect(() => {
    const root = document.documentElement
    root.toggleAttribute('data-borderless', borderless)
    return () => root.removeAttribute('data-borderless')
  }, [borderless])

  useEffect(() => {
    const syncGlassSettings = () => {
      applyGlassSettingsToDocument(readGlassSettings())
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === GLASS_SETTINGS_STORAGE_KEY) {
        syncGlassSettings()
      }
    }

    syncGlassSettings()
    window.addEventListener(GLASS_SETTINGS_EVENT, syncGlassSettings)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener(GLASS_SETTINGS_EVENT, syncGlassSettings)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  useEffect(() => {
    const syncFontSettings = () => {
      void applyFontSettingsToDocument(readFontSettings())
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === FONT_SETTINGS_STORAGE_KEY) {
        syncFontSettings()
      }
    }

    syncFontSettings()
    window.addEventListener(FONT_SETTINGS_EVENT, syncFontSettings)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener(FONT_SETTINGS_EVENT, syncFontSettings)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])
}
