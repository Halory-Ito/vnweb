'use client'

import { useAtom } from 'jotai'
import { useTheme } from 'next-themes'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import AppHeader from './app-header'
import AppSideBar from './app-sidebar'
import { bgAtom } from '@/atom/global'
import {
  BACKGROUND_SETTINGS_EVENT,
  BACKGROUND_SETTINGS_STORAGE_KEY,
  DEFAULT_BACKGROUND_SETTINGS,
  readBackgroundSettings,
} from '@/lib/background-settings'
import {
  applyFontSettingsToDocument,
  FONT_SETTINGS_EVENT,
  FONT_SETTINGS_STORAGE_KEY,
  readFontSettings,
} from '@/lib/font-settings'
import {
  applyGlassSettingsToDocument,
  GLASS_SETTINGS_EVENT,
  GLASS_SETTINGS_STORAGE_KEY,
  readGlassSettings,
} from '@/lib/glass-settings'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [bg, setBg] = useAtom(bgAtom)
  const { resolvedTheme } = useTheme()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [backgroundSettings, setBackgroundSettings] = useState(
    DEFAULT_BACKGROUND_SETTINGS,
  )

  useEffect(() => {
    setMounted(true)

    const initialBackgroundSettings = readBackgroundSettings()
    setBackgroundSettings(initialBackgroundSettings)
    setBg(initialBackgroundSettings.lastGameBackgroundImage)
  }, [setBg])

  useEffect(() => {
    const syncBackgroundSettings = () => {
      const nextSettings = readBackgroundSettings()
      setBackgroundSettings(nextSettings)
      setBg(nextSettings.lastGameBackgroundImage)
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === BACKGROUND_SETTINGS_STORAGE_KEY) {
        syncBackgroundSettings()
      }
    }

    syncBackgroundSettings()
    window.addEventListener(BACKGROUND_SETTINGS_EVENT, syncBackgroundSettings)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener(
        BACKGROUND_SETTINGS_EVENT,
        syncBackgroundSettings,
      )
      window.removeEventListener('storage', handleStorage)
    }
  }, [setBg])

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

  const isGameInfoPage = pathname.startsWith('/game/info/')

  useEffect(() => {
    if (isGameInfoPage) {
      return
    }

    if (
      backgroundSettings.customBackgroundEnabled &&
      backgroundSettings.customBackgroundImage
    ) {
      setBg(backgroundSettings.customBackgroundImage)
      return
    }

    setBg(backgroundSettings.lastGameBackgroundImage)
  }, [
    backgroundSettings.customBackgroundEnabled,
    backgroundSettings.customBackgroundImage,
    backgroundSettings.lastGameBackgroundImage,
    isGameInfoPage,
    setBg,
  ])

  const nonGameInfoBackground = backgroundSettings.customBackgroundEnabled
    ? backgroundSettings.customBackgroundImage || bg
    : bg
  const activeBackground = isGameInfoPage ? bg : nonGameInfoBackground

  return (
    <div className="relative flex h-screen w-screen overflow-hidden">
      <div
        className="app-bg-image-layer pointer-events-none absolute inset-0 z-0 transition-all duration-300"
        style={
          mounted && resolvedTheme === 'dark'
            ? {
                backgroundImage: `url(${activeBackground})`,
              }
            : {
                backgroundImage: 'none',
              }
        }
      />

      <div className="app-glass-overlay pointer-events-none absolute inset-0 z-10" />

      <div className="relative z-20 flex h-full w-full">
        <AppSideBar />
        <div className="w-full">
          <AppHeader />
          <div>{children}</div>
        </div>
      </div>
    </div>
  )
}
