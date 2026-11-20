'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export function useIdleVisibility(enabled: boolean, delayMs = 3000) {
  const [isIdle, setIsIdle] = useState(false)
  const timerRef = useRef<number | null>(null)
  const pinnedRef = useRef(false)

  const scheduleHide = useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    if (!enabled || pinnedRef.current) return
    timerRef.current = window.setTimeout(() => setIsIdle(true), delayMs)
  }, [delayMs, enabled])

  const notifyActivity = useCallback(() => {
    if (!enabled) return
    setIsIdle(false)
    scheduleHide()
  }, [enabled, scheduleHide])

  const setPinned = useCallback(
    (pinned: boolean) => {
      pinnedRef.current = pinned
      if (pinned) {
        if (timerRef.current !== null) window.clearTimeout(timerRef.current)
        setIsIdle(false)
      } else {
        scheduleHide()
      }
    },
    [scheduleHide],
  )

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
      setIsIdle(false)
      return
    }
    scheduleHide()
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
  }, [enabled, scheduleHide])

  return { isIdle: enabled && isIdle, notifyActivity, setPinned }
}
