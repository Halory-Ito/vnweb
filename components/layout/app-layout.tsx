'use client'

import { useAtom } from 'jotai'
import { useTheme } from 'next-themes'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import AppHeader from './app-header'
import AppSideBar from './app-sidebar'
import { bgAtom } from '@/atom/global'
import {
  BACKGROUND_SETTINGS_EVENT,
  BACKGROUND_SETTINGS_STORAGE_KEY,
  DEFAULT_BACKGROUND_SETTINGS,
  type BackgroundTransitionStyle,
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
  const [displayBackground, setDisplayBackground] = useState('')
  const [previousBackground, setPreviousBackground] = useState('')
  const [isBgTransitioning, setIsBgTransitioning] = useState(false)
  const [transitionStyle, setTransitionStyle] =
    useState<BackgroundTransitionStyle>('center-fade')
  const [transitionDurationMs, setTransitionDurationMs] = useState(420)
  const transitionTimerRef = useRef<number | null>(null)

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

  useEffect(() => {
    setTransitionStyle(backgroundSettings.transitionStyle)
    setTransitionDurationMs(backgroundSettings.transitionDurationMs)
  }, [
    backgroundSettings.transitionDurationMs,
    backgroundSettings.transitionStyle,
  ])

  const enterClassByStyle: Record<BackgroundTransitionStyle, string> = {
    none: '',
    'center-fade': 'app-bg-image-layer-enter-center-fade',
    'cross-fade': 'app-bg-image-layer-enter-cross-fade',
    'slide-up': 'app-bg-image-layer-enter-slide-up',
    'zoom-fade': 'app-bg-image-layer-enter-zoom-fade',
  }

  const exitClassByStyle: Record<BackgroundTransitionStyle, string> = {
    none: '',
    'center-fade': 'app-bg-image-layer-exit-center-fade',
    'cross-fade': 'app-bg-image-layer-exit-cross-fade',
    'slide-up': 'app-bg-image-layer-exit-slide-up',
    'zoom-fade': 'app-bg-image-layer-exit-zoom-fade',
  }

  useEffect(() => {
    if (!activeBackground) {
      setDisplayBackground('')
      setPreviousBackground('')
      setIsBgTransitioning(false)
      return
    }

    if (!displayBackground) {
      setDisplayBackground(activeBackground)
      return
    }

    if (activeBackground === displayBackground) {
      return
    }

    if (transitionStyle === 'none' || transitionDurationMs <= 0) {
      setPreviousBackground('')
      setDisplayBackground(activeBackground)
      setIsBgTransitioning(false)
      return
    }

    setPreviousBackground(displayBackground)
    setDisplayBackground(activeBackground)
    setIsBgTransitioning(true)

    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current)
    }

    transitionTimerRef.current = window.setTimeout(() => {
      setPreviousBackground('')
      setIsBgTransitioning(false)
      transitionTimerRef.current = null
    }, transitionDurationMs)
  }, [
    activeBackground,
    displayBackground,
    transitionDurationMs,
    transitionStyle,
  ])

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        window.clearTimeout(transitionTimerRef.current)
      }
    }
  }, [])

  return (
    <div className="relative flex h-screen w-screen overflow-hidden">
      {mounted && resolvedTheme === 'dark' ? (
        <>
          {previousBackground && isBgTransitioning ? (
            <div
              className={`app-bg-image-layer pointer-events-none absolute inset-0 z-0 ${exitClassByStyle[transitionStyle]}`}
              style={{
                backgroundImage: `url(${previousBackground})`,
                animationDuration: `${transitionDurationMs}ms`,
              }}
            />
          ) : null}
          <div
            className={`app-bg-image-layer pointer-events-none absolute inset-0 z-0 ${isBgTransitioning ? enterClassByStyle[transitionStyle] : ''}`}
            style={{
              backgroundImage: displayBackground
                ? `url(${displayBackground})`
                : 'none',
              animationDuration: `${transitionDurationMs}ms`,
            }}
          />
        </>
      ) : (
        <div
          className="app-bg-image-layer pointer-events-none absolute inset-0 z-0"
          style={{ backgroundImage: 'none' }}
        />
      )}

      <div className="app-glass-overlay pointer-events-none absolute inset-0 z-10" />

      <div className="relative z-20 flex h-full w-full min-w-0 overflow-hidden">
        <AppSideBar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <AppHeader />
          <div className="min-w-0 flex-1 overflow-hidden">{children}</div>
        </div>
      </div>
    </div>
  )
}
