'use client'

import { useAtom } from 'jotai'
import { useTheme } from 'next-themes'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import AppLayoutContent from './app-layout-content'
import { bgAtom } from '@/atom/global'
import { useAppAppearance } from '@/hooks/use-app-appearance'
import {
  BACKGROUND_SETTINGS_EVENT,
  BACKGROUND_SETTINGS_STORAGE_KEY,
  DEFAULT_BACKGROUND_SETTINGS,
  type BackgroundTransitionStyle,
  getCurrentDeviceBackgroundImage,
  readBackgroundSettings,
} from '@/lib/settings/background-settings'

const toCssBackgroundImage = (url: string) => {
  if (!url) return 'none'
  const escaped = url.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  return `url("${escaped}")`
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  useAppAppearance()
  const [bg, setBg] = useAtom(bgAtom)
  const { resolvedTheme } = useTheme()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [backgroundSettings, setBackgroundSettings] = useState(DEFAULT_BACKGROUND_SETTINGS)
  const [displayBackground, setDisplayBackground] = useState('')
  const [previousBackground, setPreviousBackground] = useState('')
  const [isBgTransitioning, setIsBgTransitioning] = useState(false)
  const [transitionStyle, setTransitionStyle] = useState<BackgroundTransitionStyle>('center-fade')
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
      window.removeEventListener(BACKGROUND_SETTINGS_EVENT, syncBackgroundSettings)
      window.removeEventListener('storage', handleStorage)
    }
  }, [setBg])

  const isDynamicBgPage =
    pathname.startsWith('/game/info/') ||
    pathname.startsWith('/ost') ||
    pathname.startsWith('/guide/')

  // 获取当前设备对应的自定义背景
  const currentDeviceCustomBackground = getCurrentDeviceBackgroundImage(backgroundSettings)

  useEffect(() => {
    if (isDynamicBgPage) {
      return
    }

    if (backgroundSettings.customBackgroundEnabled && currentDeviceCustomBackground) {
      setBg(currentDeviceCustomBackground)
      return
    }

    setBg(backgroundSettings.lastGameBackgroundImage)
  }, [
    backgroundSettings.customBackgroundEnabled,
    currentDeviceCustomBackground,
    backgroundSettings.lastGameBackgroundImage,
    isDynamicBgPage,
    setBg,
  ])

  const nonGameInfoBackground = backgroundSettings.customBackgroundEnabled
    ? currentDeviceCustomBackground || bg
    : bg
  const activeBackground = isDynamicBgPage ? bg : nonGameInfoBackground

  useEffect(() => {
    setTransitionStyle(backgroundSettings.transitionStyle)
    setTransitionDurationMs(backgroundSettings.transitionDurationMs)
  }, [backgroundSettings.transitionDurationMs, backgroundSettings.transitionStyle])

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
  }, [activeBackground, displayBackground, transitionDurationMs, transitionStyle])

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        window.clearTimeout(transitionTimerRef.current)
      }
    }
  }, [])

  return (
    <div className="relative flex h-dvh w-full overflow-hidden">
      {mounted && resolvedTheme === 'dark' ? (
        <>
          {previousBackground && isBgTransitioning ? (
            <div
              key={`prev-${previousBackground}`}
              className={`app-bg-image-layer pointer-events-none absolute inset-0 z-0 ${exitClassByStyle[transitionStyle]}`}
              style={{
                backgroundImage: toCssBackgroundImage(previousBackground),
                animationDuration: `${transitionDurationMs}ms`,
              }}
            />
          ) : null}
          <div
            key={displayBackground || 'empty-bg'}
            className={`app-bg-image-layer pointer-events-none absolute inset-0 z-0 ${isBgTransitioning ? enterClassByStyle[transitionStyle] : ''}`}
            style={{
              backgroundImage: toCssBackgroundImage(displayBackground),
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

      <AppLayoutContent>{children}</AppLayoutContent>
    </div>
  )
}
