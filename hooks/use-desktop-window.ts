'use client'

import { useAtomValue } from 'jotai'
import { type MouseEvent, useCallback, useEffect, useState } from 'react'

import { nativeTitleBarAtom } from '@/hooks/use-layout-visibility'
import {
  closeDesktopWindow,
  isDesktopRuntime,
  isDesktopWindowMaximized,
  minimizeDesktopWindow,
  startDesktopWindowDragging,
  subscribeDesktopWindowResize,
  toggleMaximizeDesktopWindow,
} from '@/lib/desktop-window'

const HEADER_NO_DRAG_SELECTOR =
  'button, a, input, select, textarea, label, [role="button"], [role="combobox"], [role="textbox"], [role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], [role="option"], [role="listbox"], [role="switch"], [role="checkbox"], [role="radio"], [role="tab"], [role="slider"], [contenteditable="true"], [data-no-drag]'

export function useDesktopWindow() {
  const nativeTitleBar = useAtomValue(nativeTitleBarAtom)
  const [isDesktop, setIsDesktop] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    setIsDesktop(isDesktopRuntime())
  }, [])

  useEffect(() => {
    if (!isDesktop) return

    let active = true
    let unlistenResize: (() => void) | undefined

    const sync = () => {
      void isDesktopWindowMaximized().then((maximized) => {
        if (active) setIsMaximized(maximized)
      })
    }

    sync()
    window.addEventListener('resize', sync)
    void subscribeDesktopWindowResize(sync).then((unlisten) => {
      if (active) {
        unlistenResize = unlisten
      } else {
        unlisten()
      }
    })

    return () => {
      active = false
      window.removeEventListener('resize', sync)
      unlistenResize?.()
    }
  }, [isDesktop])

  const showCustomControls = isDesktop && !nativeTitleBar

  const minimize = useCallback(() => {
    void minimizeDesktopWindow()
  }, [])

  const toggleMaximize = useCallback(async () => {
    const maximized = await toggleMaximizeDesktopWindow()
    setIsMaximized(maximized)
  }, [])

  const close = useCallback(() => {
    void closeDesktopWindow()
  }, [])

  const handleHeaderMouseDown = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      if (!showCustomControls || event.button !== 0) return

      const target = event.target instanceof Element ? event.target : null
      if (!target || !event.currentTarget.contains(target)) return
      if (target.closest(HEADER_NO_DRAG_SELECTOR)) return

      if (event.detail === 2) {
        event.preventDefault()
        void toggleMaximize()
        return
      }

      if (event.detail === 1) {
        void startDesktopWindowDragging()
      }
    },
    [showCustomControls, toggleMaximize],
  )

  return {
    isDesktop,
    showCustomControls,
    isMaximized,
    minimize,
    toggleMaximize,
    close,
    handleHeaderMouseDown,
  }
}
