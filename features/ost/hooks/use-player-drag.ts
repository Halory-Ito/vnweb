'use client'

import { useEffect, useRef, useState } from 'react'

import type { KeyboardEvent, MouseEvent, PointerEvent } from 'react'

type Position = { x: number; y: number }

const LONG_PRESS_MS = 220
const MOVE_CANCEL_PX = 8
const INTERACTIVE_SELECTOR = '[role="slider"], input, textarea, select, [data-no-drag="true"]'

export function usePlayerDrag(enabled: boolean, rebindKey = '') {
  const panel = useRef<HTMLDivElement>(null)
  const timer = useRef<number | null>(null)
  const pending = useRef<{
    id: number
    startX: number
    startY: number
    offsetX: number
    offsetY: number
  } | null>(null)
  const dragging = useRef<{ id: number; offsetX: number; offsetY: number } | null>(null)
  const suppressClick = useRef(false)
  const [position, setPosition] = useState<Position | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  function clearTimer() {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
  }

  function clamp(point: Position) {
    const element = panel.current
    if (!element) return point
    return {
      x: Math.max(0, Math.min(point.x, window.innerWidth - element.offsetWidth)),
      y: Math.max(0, Math.min(point.y, window.innerHeight - element.offsetHeight)),
    }
  }

  function stopDrag() {
    clearTimer()
    pending.current = null
    dragging.current = null
    setIsDragging(false)
  }

  useEffect(() => {
    if (!enabled || !panel.current) return
    void rebindKey
    const fit = () => setPosition((previous) => previous && clamp(previous))
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(panel.current)
    window.addEventListener('resize', fit)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', fit)
      stopDrag()
    }
  }, [enabled, rebindKey])

  return {
    panel,
    isDragging,
    style: position
      ? { left: position.x, top: position.y, right: 'auto', bottom: 'auto' }
      : undefined,
    handle: {
      onPointerDown(event: PointerEvent<HTMLDivElement>) {
        if (!enabled || !event.isPrimary || event.button !== 0 || !panel.current) return
        const target = event.target as HTMLElement | null
        if (target?.closest(INTERACTIVE_SELECTOR)) return

        const bounds = panel.current.getBoundingClientRect()
        const info = {
          id: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          offsetX: event.clientX - bounds.left,
          offsetY: event.clientY - bounds.top,
        }
        pending.current = info
        clearTimer()
        timer.current = window.setTimeout(() => {
          const current = pending.current
          const element = panel.current
          if (!current || current.id !== info.id || !element) return
          pending.current = null
          dragging.current = { id: current.id, offsetX: current.offsetX, offsetY: current.offsetY }
          suppressClick.current = true
          setIsDragging(true)
          try {
            element.setPointerCapture(current.id)
          } catch {
            // Pointer may already be released on some browsers
          }
        }, LONG_PRESS_MS)
      },
      onPointerMove(event: PointerEvent<HTMLDivElement>) {
        const active = dragging.current
        if (active?.id === event.pointerId) {
          event.preventDefault()
          setPosition(
            clamp({ x: event.clientX - active.offsetX, y: event.clientY - active.offsetY }),
          )
          return
        }
        const waiting = pending.current
        if (waiting?.id === event.pointerId) {
          const dx = event.clientX - waiting.startX
          const dy = event.clientY - waiting.startY
          if (Math.hypot(dx, dy) > MOVE_CANCEL_PX) {
            clearTimer()
            pending.current = null
          }
        }
      },
      onPointerUp(event: PointerEvent<HTMLDivElement>) {
        if (pending.current?.id === event.pointerId || dragging.current?.id === event.pointerId) {
          stopDrag()
        }
      },
      onPointerCancel(event: PointerEvent<HTMLDivElement>) {
        if (pending.current?.id === event.pointerId || dragging.current?.id === event.pointerId) {
          stopDrag()
        }
      },
      onLostPointerCapture() {
        stopDrag()
      },
      onClickCapture(event: MouseEvent<HTMLDivElement>) {
        if (suppressClick.current) {
          suppressClick.current = false
          event.preventDefault()
          event.stopPropagation()
        }
      },
      onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
        if (event.target !== event.currentTarget) return
        const offsets: Record<string, Position> = {
          ArrowLeft: { x: -16, y: 0 },
          ArrowRight: { x: 16, y: 0 },
          ArrowUp: { x: 0, y: -16 },
          ArrowDown: { x: 0, y: 16 },
        }
        const delta = offsets[event.key]
        const bounds = panel.current?.getBoundingClientRect()
        if (!delta || !bounds) return
        event.preventDefault()
        setPosition(clamp({ x: bounds.left + delta.x, y: bounds.top + delta.y }))
      },
    },
  }
}
