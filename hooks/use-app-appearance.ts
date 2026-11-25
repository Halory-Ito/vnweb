'use client'

import { atom, useAtomValue, useStore, type WritableAtom } from 'jotai'
import { useEffect, useLayoutEffect } from 'react'

import {
  borderlessAtom,
  hasStoredNativeTitleBar,
  headerHiddenAtom,
  nativeTitleBarAtom,
  sidebarHiddenAtom,
} from './use-layout-visibility'
import { syncDesktopNativeTitleBar } from '@/lib/desktop-window'
import {
  getBackgroundConfigApi,
  normalizeBackgroundSettings,
  notifyBackgroundSettingsChanged,
  readBackgroundSettings,
  writeBackgroundSettings,
} from '@/lib/settings/background-settings'
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
import {
  folderColorsAtom,
  folderPaletteAtom,
  folderPaletteModeAtom,
} from '@/lib/settings/game-library-folder-colors'
import { gameLibraryGridDisplayAtom } from '@/lib/settings/game-library-grid-display'
import { gameLibraryGroupAtom } from '@/lib/settings/game-library-group'
import { gameLibraryLayoutAtom } from '@/lib/settings/game-library-layout'
import {
  applyGlassSettingsToDocument,
  getGlassConfigApi,
  GLASS_SETTINGS_EVENT,
  GLASS_SETTINGS_STORAGE_KEY,
  normalizeGlassSettings,
  notifyGlassSettingsChanged,
  readGlassSettings,
  writeGlassSettings,
} from '@/lib/settings/glass-settings'
import {
  getLayoutConfigApi,
  hasUserModifiedLayoutKey,
  type LayoutSettings,
  runWithoutLayoutSync,
  updateLayoutConfigApi,
} from '@/lib/settings/layout-settings'
import {
  getStartupConfigApi,
  normalizeStartupSettings,
  notifyStartupSettingsChanged,
  writeStartupSettings,
} from '@/lib/settings/startup-settings'

const bootstrappedStores = new WeakSet<ReturnType<typeof useStore>>()
const layoutBootstrapReadyAtom = atom(false)

function syncLayoutAtomIfUnmodified<K extends keyof LayoutSettings>(
  store: ReturnType<typeof useStore>,
  key: K,
  targetAtom: WritableAtom<LayoutSettings[K], [LayoutSettings[K]], void>,
  value: LayoutSettings[K],
) {
  if (!hasUserModifiedLayoutKey(key)) {
    store.set(targetAtom, value)
  }
}

export function useAppAppearance() {
  const store = useStore()
  const nativeTitleBar = useAtomValue(nativeTitleBarAtom)
  const layoutBootstrapReady = useAtomValue(layoutBootstrapReadyAtom)

  useLayoutEffect(() => {
    const syncBorderless = () => {
      document.documentElement.toggleAttribute('data-borderless', store.get(borderlessAtom))
    }

    const unsubscribe = store.sub(borderlessAtom, syncBorderless)
    syncBorderless()
    return unsubscribe
  }, [store])

  useEffect(() => {
    const current = store.get(nativeTitleBarAtom)
    if (current !== nativeTitleBar) {
      return
    }
    if (
      !layoutBootstrapReady &&
      !hasStoredNativeTitleBar() &&
      !hasUserModifiedLayoutKey('nativeTitleBar')
    ) {
      return
    }
    void syncDesktopNativeTitleBar(current)
  }, [layoutBootstrapReady, nativeTitleBar, store])

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
    if (bootstrappedStores.has(store)) {
      return
    }
    bootstrappedStores.add(store)

    void getLayoutConfigApi()
      .then((res) => {
        if (res.persisted) {
          runWithoutLayoutSync(() => {
            syncLayoutAtomIfUnmodified(
              store,
              'sidebarHidden',
              sidebarHiddenAtom,
              res.data.sidebarHidden,
            )
            syncLayoutAtomIfUnmodified(
              store,
              'headerHidden',
              headerHiddenAtom,
              res.data.headerHidden,
            )
            syncLayoutAtomIfUnmodified(store, 'borderless', borderlessAtom, res.data.borderless)
            syncLayoutAtomIfUnmodified(
              store,
              'nativeTitleBar',
              nativeTitleBarAtom,
              res.data.nativeTitleBar,
            )
            syncLayoutAtomIfUnmodified(
              store,
              'gameLibraryLayout',
              gameLibraryLayoutAtom,
              res.data.gameLibraryLayout,
            )
            syncLayoutAtomIfUnmodified(
              store,
              'gameLibraryGridDisplay',
              gameLibraryGridDisplayAtom,
              res.data.gameLibraryGridDisplay,
            )
            syncLayoutAtomIfUnmodified(
              store,
              'gameLibraryGroup',
              gameLibraryGroupAtom,
              res.data.gameLibraryGroup,
            )
            syncLayoutAtomIfUnmodified(
              store,
              'gameCardTitleHidden',
              gameCardTitleHiddenAtom,
              res.data.gameCardTitleHidden,
            )
            syncLayoutAtomIfUnmodified(
              store,
              'gameCardRadius',
              gameCardRadiusAtom,
              res.data.gameCardRadius,
            )
            syncLayoutAtomIfUnmodified(
              store,
              'folderPalette',
              folderPaletteAtom,
              res.data.folderPalette,
            )
            syncLayoutAtomIfUnmodified(
              store,
              'folderPaletteMode',
              folderPaletteModeAtom,
              res.data.folderPaletteMode,
            )
            syncLayoutAtomIfUnmodified(
              store,
              'folderColors',
              folderColorsAtom,
              res.data.folderColors,
            )
          })
          return
        }

        void updateLayoutConfigApi({
          sidebarHidden: store.get(sidebarHiddenAtom),
          headerHidden: store.get(headerHiddenAtom),
          borderless: store.get(borderlessAtom),
          nativeTitleBar: store.get(nativeTitleBarAtom),
          gameLibraryLayout: store.get(gameLibraryLayoutAtom),
          gameLibraryGridDisplay: store.get(gameLibraryGridDisplayAtom),
          gameLibraryGroup: store.get(gameLibraryGroupAtom),
          gameCardTitleHidden: store.get(gameCardTitleHiddenAtom),
          gameCardRadius: store.get(gameCardRadiusAtom),
          folderPalette: store.get(folderPaletteAtom),
          folderPaletteMode: store.get(folderPaletteModeAtom),
          folderColors: store.get(folderColorsAtom),
        })
      })
      .catch((error) => {
        console.error('Bootstrap layout settings failed:', error)
      })
      .finally(() => {
        store.set(layoutBootstrapReadyAtom, true)
      })

    void getGlassConfigApi()
      .then((res) => {
        if (!res?.data) return
        const normalized = normalizeGlassSettings(res.data)
        writeGlassSettings(normalized)
        applyGlassSettingsToDocument(normalized)
        notifyGlassSettingsChanged()
      })
      .catch((error) => {
        console.error('Bootstrap glass settings failed:', error)
      })

    void getBackgroundConfigApi()
      .then((res) => {
        if (!res?.data) return
        const localSettings = readBackgroundSettings()
        const merged = normalizeBackgroundSettings({
          ...localSettings,
          customBackgroundEnabled: res.data.custom.active,
          customBackgroundImagePc: res.data.custom.path.pc,
          customBackgroundImageMobile: res.data.custom.path.mobile,
          transitionStyle: res.data.transitionStyle,
          transitionDurationMs: res.data.transitionDurationMs,
        })
        writeBackgroundSettings(merged)
        notifyBackgroundSettingsChanged()
      })
      .catch((error) => {
        console.error('Bootstrap background settings failed:', error)
      })

    void getStartupConfigApi()
      .then((res) => {
        if (!res?.data) return
        writeStartupSettings(normalizeStartupSettings(res.data))
        notifyStartupSettingsChanged()
      })
      .catch((error) => {
        console.error('Bootstrap startup settings failed:', error)
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
