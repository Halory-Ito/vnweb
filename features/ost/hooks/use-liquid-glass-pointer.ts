'use client'

import { useCallback, useEffect, useRef, type PointerEvent } from 'react'

const POINTER_MEDIA_QUERY =
  '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)'
const POINTER_PROPERTIES = ['--lg-x', '--lg-y'] as const

/**
 * 追踪精细指针在液态玻璃表面移动，通过 rAF 更新焦散高光坐标 CSS 变量
 */
export function useLiquidGlassPointer(enabled = true) {
  const ref = useRef<HTMLDivElement>(null)
  const frameRef = useRef<number | null>(null)
  const mediaMatchesRef = useRef(false)

  const resetPointer = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }

    const element = ref.current
    if (!element) return

    for (const prop of POINTER_PROPERTIES) element.style.removeProperty(prop)
    element.removeAttribute('data-liquid-active')
  }, [])

  useEffect(() => {
    if (!enabled) {
      mediaMatchesRef.current = false
      resetPointer()
      return
    }

    const media = window.matchMedia(POINTER_MEDIA_QUERY)
    const sync = () => {
      mediaMatchesRef.current = media.matches
      if (!media.matches) resetPointer()
    }

    sync()
    media.addEventListener('change', sync)
    return () => {
      mediaMatchesRef.current = false
      media.removeEventListener('change', sync)
      resetPointer()
    }
  }, [enabled, resetPointer])

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (
        !enabled ||
        !mediaMatchesRef.current ||
        event.pointerType === 'touch' ||
        event.buttons !== 0
      ) {
        return
      }

      const element = event.currentTarget
      const rect = element.getBoundingClientRect()
      if (!rect.width || !rect.height) return

      const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left))
      const y = Math.max(0, Math.min(rect.height, event.clientY - rect.top))

      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null
        if (!enabled || !mediaMatchesRef.current || !element.isConnected) return

        element.style.setProperty('--lg-x', `${x.toFixed(1)}px`)
        element.style.setProperty('--lg-y', `${y.toFixed(1)}px`)
        element.setAttribute('data-liquid-active', 'true')
      })
    },
    [enabled],
  )

  return {
    ref,
    onPointerEnter: handlePointerMove,
    onPointerMove: handlePointerMove,
    onPointerLeave: resetPointer,
    onPointerCancel: resetPointer,
  }
}
