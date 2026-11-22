'use client'

import { useAtomValue, useStore } from 'jotai'
import { useEffect } from 'react'

import { borderlessAtom, headerHiddenAtom, sidebarHiddenAtom } from './use-layout-visibility'
import {
  getEmptyStateConfigApi,
  parseEmptyStateSettings,
  readEmptyStateSnapshot,
  updateEmptyStateConfigApi,
  writeEmptyStateSettings,
} from '@/lib/settings/empty-state-settings'
import {
  applyFontSettingsToDocument,
  FONT_SETTINGS_EVENT,
  FONT_SETTINGS_STORAGE_KEY,
  getFontConfigApi,
  notifyFontSettingsChanged,
  readFontSettings,
  updateFontConfigApi,
  writeFontSettings,
} from '@/lib/settings/font-settings'
import { gameCardRadiusAtom, gameCardTitleHiddenAtom } from '@/lib/settings/game-card-appearance'
import { folderColorsAtom, folderPaletteAtom } from '@/lib/settings/game-library-folder-colors'
import { folderLogosStorageAtom } from '@/lib/settings/game-library-folder-logos'
import { gameLibraryGridDisplayAtom } from '@/lib/settings/game-library-grid-display'
import { gameLibraryGroupAtom } from '@/lib/settings/game-library-group'
import { gameLibraryLayoutAtom } from '@/lib/settings/game-library-layout'
import {
  applyGlassSettingsToDocument,
  GLASS_SETTINGS_EVENT,
  GLASS_SETTINGS_STORAGE_KEY,
  readGlassSettings,
} from '@/lib/settings/glass-settings'
import {
  getLayoutConfigApi,
  runWithoutLayoutSync,
  updateLayoutConfigApi,
} from '@/lib/settings/layout-settings'

let appearanceBootstrapStarted = false

export function useAppAppearance() {
  const store = useStore()
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

  useEffect(() => {
    if (appearanceBootstrapStarted) {
      return
    }
    appearanceBootstrapStarted = true

    void getLayoutConfigApi()
      .then((res) => {
        if (res.persisted) {
          runWithoutLayoutSync(() => {
            store.set(sidebarHiddenAtom, res.data.sidebarHidden)
            store.set(headerHiddenAtom, res.data.headerHidden)
            store.set(borderlessAtom, res.data.borderless)
            store.set(gameLibraryLayoutAtom, res.data.gameLibraryLayout)
            store.set(gameLibraryGridDisplayAtom, res.data.gameLibraryGridDisplay)
            store.set(gameLibraryGroupAtom, res.data.gameLibraryGroup)
            store.set(gameCardTitleHiddenAtom, res.data.gameCardTitleHidden)
            store.set(gameCardRadiusAtom, res.data.gameCardRadius)
            store.set(folderPaletteAtom, res.data.folderPalette)
            store.set(folderColorsAtom, res.data.folderColors)
            store.set(folderLogosStorageAtom, res.data.folderLogos)
          })
          return
        }

        void updateLayoutConfigApi({
          sidebarHidden: store.get(sidebarHiddenAtom),
          headerHidden: store.get(headerHiddenAtom),
          borderless: store.get(borderlessAtom),
          gameLibraryLayout: store.get(gameLibraryLayoutAtom),
          gameLibraryGridDisplay: store.get(gameLibraryGridDisplayAtom),
          gameLibraryGroup: store.get(gameLibraryGroupAtom),
          gameCardTitleHidden: store.get(gameCardTitleHiddenAtom),
          gameCardRadius: store.get(gameCardRadiusAtom),
          folderPalette: store.get(folderPaletteAtom),
          folderColors: store.get(folderColorsAtom),
          folderLogos: store.get(folderLogosStorageAtom),
        })
      })
      .catch((error) => {
        console.error('Bootstrap layout settings failed:', error)
      })

    void getEmptyStateConfigApi()
      .then((res) => {
        if (res.persisted) {
          writeEmptyStateSettings(res.data)
          return
        }
        void updateEmptyStateConfigApi(parseEmptyStateSettings(readEmptyStateSnapshot()))
      })
      .catch((error) => {
        console.error('Bootstrap empty state settings failed:', error)
      })

    void getFontConfigApi()
      .then((res) => {
        if (res.persisted) {
          writeFontSettings(res.data)
          void applyFontSettingsToDocument(res.data)
          notifyFontSettingsChanged()
          return
        }
        void updateFontConfigApi(readFontSettings())
      })
      .catch((error) => {
        console.error('Bootstrap font settings failed:', error)
      })
  }, [store])
}
