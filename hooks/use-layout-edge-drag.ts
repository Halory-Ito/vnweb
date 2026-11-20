'use client'

import { useLayoutEffect, useRef } from 'react'

import type { MouseEvent, PointerEvent, RefObject } from 'react'

type EdgeGesture = {
  pointerId: number
  startX: number
  startY: number
  size: number
  offset: number
  moved: boolean
}

const DRAG_THRESHOLD_PX = 4
const SETTLE_DURATION_MS = 200

export function useLayoutEdgeDrag(
  side: 'left' | 'top',
  hidden: boolean,
  regionRef: RefObject<HTMLElement | null> | null,
  onHiddenChange: (hidden: boolean) => void,
) {
  const gesture = useRef<EdgeGesture | null>(null)
  const animation = useRef<Animation | null>(null)
  const suppressClick = useRef(false)
  const margin = side === 'left' ? 'marginLeft' : 'marginTop'

  useLayoutEffect(() => {
    const region = regionRef?.current
    return () => {
      animation.current?.cancel()
      animation.current = null
      gesture.current = null
      if (region) {
        region.style.removeProperty('display')
        region.style[margin] = ''
      }
    }
  }, [hidden, margin, regionRef])

  function getSize(region: HTMLElement) {
    return side === 'left' ? region.offsetWidth : region.offsetHeight
  }

  function prepareRegion() {
    const region = regionRef?.current
    if (!region) return 80
    if (hidden) region.style.display = side === 'left' ? 'block' : 'flex'
    const size = getSize(region)
    if (hidden) region.style[margin] = `${-size}px`
    return size
  }

  function settle(offset: number, nextHidden: boolean) {
    const region = regionRef?.current
    function finish() {
      if (nextHidden !== hidden) {
        onHiddenChange(nextHidden)
      } else if (region) {
        region.style.removeProperty('display')
        region.style[margin] = ''
      }
    }
    if (!region) {
      finish()
      return
    }

    const target = nextHidden ? getSize(region) : 0
    region.style[margin] = `${-target}px`
    if (offset === target || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finish()
      return
    }

    const transition = region.animate(
      { [margin]: [`${-offset}px`, `${-target}px`] },
      { duration: SETTLE_DURATION_MS, easing: 'ease-out' },
    )
    animation.current = transition
    transition.onfinish = () => {
      animation.current = null
      finish()
    }
  }

  function end(event: PointerEvent<HTMLButtonElement>, commit: boolean) {
    const current = gesture.current
    if (current?.pointerId !== event.pointerId) return
    gesture.current = null
    const distance = hidden ? current.size - current.offset : current.offset
    const toggle = commit && distance >= Math.max(24, current.size * 0.4)
    settle(current.offset, toggle ? !hidden : hidden)
  }

  return {
    onPointerDown(event: PointerEvent<HTMLButtonElement>) {
      if (!event.isPrimary || event.button !== 0 || gesture.current) return
      if (animation.current) {
        suppressClick.current = true
        return
      }

      suppressClick.current = false
      const size = prepareRegion()
      gesture.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        size,
        offset: hidden ? size : 0,
        moved: false,
      }
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    onPointerMove(event: PointerEvent<HTMLButtonElement>) {
      const current = gesture.current
      const region = regionRef?.current
      if (current?.pointerId !== event.pointerId) return

      const dx = current.startX - event.clientX
      const dy = current.startY - event.clientY
      if (!current.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return

      current.moved = true
      suppressClick.current = true
      const offset = (hidden ? current.size : 0) + (side === 'left' ? dx : dy)
      current.offset = Math.max(0, Math.min(offset, current.size))
      if (region) region.style[margin] = `${-current.offset}px`
    },
    onPointerUp: (event: PointerEvent<HTMLButtonElement>) => end(event, true),
    onPointerCancel: (event: PointerEvent<HTMLButtonElement>) => end(event, false),
    onLostPointerCapture: (event: PointerEvent<HTMLButtonElement>) => end(event, false),
    onClick(event: MouseEvent<HTMLButtonElement>) {
      if (animation.current || (event.detail && suppressClick.current)) return
      settle(hidden ? prepareRegion() : 0, !hidden)
    },
  }
}
