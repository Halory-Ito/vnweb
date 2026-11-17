'use client'

import { useCallback, useEffect, useRef, type PointerEvent } from 'react'

const TILT_MEDIA_QUERY =
  '(width >= 768px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)'
const TILT_PROPERTIES = [
  '--cover-rotate-x',
  '--cover-rotate-y',
  '--cover-light-x',
  '--cover-light-y',
] as const

export function useGameCoverTilt() {
  const coverRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<number | null>(null)
  const enabledRef = useRef(false)

  const resetTilt = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }

    const cover = coverRef.current
    if (!cover) return

    for (const property of TILT_PROPERTIES) cover.style.removeProperty(property)
    cover.removeAttribute('data-tilting')
  }, [])

  useEffect(() => {
    const media = window.matchMedia(TILT_MEDIA_QUERY)
    const syncEnabled = () => {
      enabledRef.current = media.matches
      if (!media.matches) resetTilt()
    }

    syncEnabled()
    media.addEventListener('change', syncEnabled)
    return () => {
      enabledRef.current = false
      media.removeEventListener('change', syncEnabled)
      resetTilt()
    }
  }, [resetTilt])

  const handlePointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (!enabledRef.current || event.pointerType === 'touch' || event.buttons !== 0) return

    const cover = event.currentTarget
    const { left, top, width, height } = cover.getBoundingClientRect()
    if (!width || !height) return

    const x = Math.max(-1, Math.min(1, ((event.clientX - left) / width - 0.5) * 2))
    const y = Math.max(-1, Math.min(1, ((event.clientY - top) / height - 0.5) * 2))

    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null
      if (!enabledRef.current || !cover.isConnected) return

      cover.style.setProperty('--cover-rotate-x', `${-4 - y * 6}deg`)
      cover.style.setProperty('--cover-rotate-y', `${-12 + x * 8}deg`)
      cover.style.setProperty('--cover-light-x', `${50 + x * 35}%`)
      cover.style.setProperty('--cover-light-y', `${35 + y * 30}%`)
      cover.setAttribute('data-tilting', 'true')
    })
  }, [])

  return {
    ref: coverRef,
    onPointerEnter: handlePointerMove,
    onPointerMove: handlePointerMove,
    onPointerLeave: resetTilt,
    onPointerCancel: resetTilt,
  }
}
