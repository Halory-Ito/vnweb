'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import {
  type ActiveStartupMedia,
  getActiveStartupMedia,
  readStartupSettings,
  type StartupSettings,
} from '@/lib/settings/startup-settings'
import { cn } from '@/lib/utils'

const STARTUP_PLAYED_SESSION_KEY = 'vnweb:startup-played'
const LEAVE_TRANSITION_MS = 360

declare global {
  interface Window {
    __VNWEB_DESKTOP_SPLASH_DONE__?: boolean
  }
}

type Props = {
  preview?: boolean
  settingsOverride?: StartupSettings
  onClose?: () => void
}

export function StartupSplashOverlay({ preview = false, settingsOverride, onClose }: Props) {
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [mutedFallback, setMutedFallback] = useState(false)
  const [activeMedia, setActiveMedia] = useState<ActiveStartupMedia | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const leaveTimerRef = useRef<number | null>(null)
  const closingRef = useRef(false)

  const dismiss = useCallback(() => {
    if (closingRef.current) return
    closingRef.current = true
    setLeaving(true)
    leaveTimerRef.current = window.setTimeout(() => {
      setVisible(false)
      onClose?.()
    }, LEAVE_TRANSITION_MS)
  }, [onClose])

  useEffect(() => {
    if (preview) {
      const target = settingsOverride ?? readStartupSettings()
      const resolved = getActiveStartupMedia(target)
      if (!resolved.mediaPath) {
        onClose?.()
        return
      }
      closingRef.current = false
      setLeaving(false)
      setMutedFallback(false)
      setActiveMedia(resolved)
      setVisible(true)
      return
    }

    if (window.__VNWEB_DESKTOP_SPLASH_DONE__) return
    try {
      if (window.sessionStorage.getItem(STARTUP_PLAYED_SESSION_KEY) === '1') return
    } catch {
      // Ignore storage access failures.
    }

    const local = readStartupSettings()
    const resolved = getActiveStartupMedia(local)
    if (!local.enabled || !resolved.mediaPath) return

    try {
      window.sessionStorage.setItem(STARTUP_PLAYED_SESSION_KEY, '1')
    } catch {
      // Ignore storage access failures.
    }
    closingRef.current = false
    setLeaving(false)
    setMutedFallback(false)
    setActiveMedia(resolved)
    setVisible(true)
  }, [onClose, preview, settingsOverride])

  useEffect(() => {
    return () => {
      if (leaveTimerRef.current) {
        window.clearTimeout(leaveTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!visible || !activeMedia || activeMedia.mediaType !== 'image') return
    const timer = window.setTimeout(dismiss, activeMedia.durationMs)
    return () => window.clearTimeout(timer)
  }, [activeMedia, dismiss, visible])

  useEffect(() => {
    if (!visible || !activeMedia || activeMedia.mediaType !== 'video') return
    const video = videoRef.current
    if (!video) return

    void video.play().catch(() => {
      setMutedFallback(true)
      video.muted = true
      void video.play().catch(() => {
        dismiss()
      })
    })
  }, [activeMedia, dismiss, visible])

  const canSkip = Boolean(activeMedia && (preview || activeMedia.skippable))
  useEffect(() => {
    if (!visible || !canSkip) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        dismiss()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canSkip, dismiss, visible])

  if (!visible || !activeMedia?.mediaPath || typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="启动动画"
      onDoubleClick={canSkip ? dismiss : undefined}
      className={cn(
        'fixed inset-0 z-100 h-dvh w-dvw overflow-hidden bg-black transition-opacity duration-350 ease-out select-none',
        leaving ? 'pointer-events-none opacity-0' : 'opacity-100',
      )}
    >
      {activeMedia.mediaType === 'image' ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={activeMedia.mediaPath}
          alt="启动动画"
          draggable={false}
          onError={dismiss}
          className="absolute inset-0 block h-full w-full animate-[app-bg-center-fade-in_700ms_ease-out] object-cover object-center select-none"
        />
      ) : (
        <video
          ref={videoRef}
          src={activeMedia.mediaPath}
          autoPlay
          playsInline
          muted={mutedFallback || activeMedia.muted}
          onEnded={dismiss}
          onError={dismiss}
          className="absolute inset-0 block h-full w-full object-cover object-center"
        />
      )}
    </div>,
    document.body,
  )
}
