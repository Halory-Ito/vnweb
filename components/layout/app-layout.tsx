'use client'

import { useAtom } from 'jotai'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

import AppHeader from './app-header'
import AppSideBar from './app-sidebar'
import { bgAtom } from '@/atom/global'
import {
  applyGlassSettingsToDocument,
  GLASS_SETTINGS_EVENT,
  GLASS_SETTINGS_STORAGE_KEY,
  readGlassSettings,
} from '@/lib/glass-settings'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [bg, _setBg] = useAtom(bgAtom)
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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

  return (
    <div className="relative flex h-screen w-screen overflow-hidden">
      <div
        className="app-bg-image-layer pointer-events-none absolute inset-0 z-0"
        style={
          mounted && resolvedTheme === 'dark'
            ? {
                backgroundImage: `url(${bg})`,
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
