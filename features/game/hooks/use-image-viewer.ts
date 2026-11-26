'use client'

import { useEffect, useRef, useState } from 'react'

import type { Dispatch, PointerEvent, SetStateAction, SyntheticEvent } from 'react'

const MIN_ZOOM = 0.25
const MAX_ZOOM = 5
const ZOOM_STEP = 0.25

const center = { x: 0, y: 0 }
export const initialImageViewerView = { zoom: 1, rotation: 0, offset: center }

type Size = { width: number; height: number }
type View = typeof initialImageViewerView
export type ImageViewerViewState = { view: View; setView: Dispatch<SetStateAction<View>> }

function fitImage(image: Size, viewport: Size, rotation: number) {
  const sideways = rotation % 180 !== 0
  const width = sideways ? image.height : image.width
  const height = sideways ? image.width : image.height
  const scale = Math.min(1, viewport.width / width, viewport.height / height)
  return { scale, width: width * scale, height: height * scale }
}

function getPanLimits(image: Size, viewport: Size, view: View) {
  const fit = fitImage(image, viewport, view.rotation)
  return {
    x: Math.max(0, (fit.width * view.zoom - viewport.width) / 2),
    y: Math.max(0, (fit.height * view.zoom - viewport.height) / 2),
  }
}

function clampOffset(offset: View['offset'], limits: View['offset']) {
  return {
    x: Math.max(-limits.x, Math.min(limits.x, offset.x)),
    y: Math.max(-limits.y, Math.min(limits.y, offset.y)),
  }
}

function changeZoom(view: View, amount: number, image: Size, viewport: Size): View {
  const zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, view.zoom + amount))
  if (zoom === view.zoom) return view
  const next = { ...view, zoom }
  return { ...next, offset: clampOffset(next.offset, getPanLimits(image, viewport, next)) }
}

export function useImageViewer({ view, setView }: ImageViewerViewState) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ pointerId: number; x: number; y: number } | null>(null)
  const [viewport, setViewport] = useState<Size>({ width: 0, height: 0 })
  const [image, setImage] = useState<Size | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const ready = Boolean(image && viewport.width && viewport.height && !loadError)
  const fit = image && fitImage(image, viewport, view.rotation)
  const limits = image ? getPanLimits(image, viewport, view) : center
  const offset = clampOffset(view.offset, limits)
  const canPan = ready && Boolean(limits.x || limits.y)

  useEffect(() => {
    const element = viewportRef.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return
      const { width, height } = entry.contentRect
      setViewport({ width, height })
      if (image && width && height) {
        setView((previous) => {
          const offset = clampOffset(
            previous.offset,
            getPanLimits(image, { width, height }, previous),
          )
          return offset.x === previous.offset.x && offset.y === previous.offset.y
            ? previous
            : { ...previous, offset }
        })
      }
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [image, setView])

  useEffect(() => {
    const element = viewportRef.current
    if (!element || !ready || !image) return
    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.deltaY === 0) return
      event.preventDefault()
      const amount = event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP
      setView((previous) => changeZoom(previous, amount, image, viewport))
    }
    element.addEventListener('wheel', handleWheel, { passive: false })
    return () => element.removeEventListener('wheel', handleWheel)
  }, [image, ready, setView, viewport])

  function stepZoom(amount: number) {
    if (!ready || !image) return
    setView((previous) => changeZoom(previous, amount, image, viewport))
  }

  function rotate(degrees: number) {
    setView((previous) => ({
      ...previous,
      rotation: (previous.rotation + degrees) % 360,
      offset: center,
    }))
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!canPan || drag.current || event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = {
      pointerId: event.pointerId,
      x: event.clientX - offset.x,
      y: event.clientY - offset.y,
    }
    setIsDragging(true)
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const start = drag.current
    if (!start || start.pointerId !== event.pointerId) return
    const nextOffset = clampOffset(
      { x: event.clientX - start.x, y: event.clientY - start.y },
      limits,
    )
    // Keep the drag anchored at the edge so reversing direction immediately moves the image.
    start.x = event.clientX - nextOffset.x
    start.y = event.clientY - nextOffset.y
    setView((previous) => ({ ...previous, offset: nextOffset }))
  }

  function handlePointerEnd(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.pointerId !== event.pointerId) return
    drag.current = null
    setIsDragging(false)
  }

  return {
    viewportRef,
    image,
    scale: fit?.scale ?? 0,
    zoom: view.zoom,
    rotation: view.rotation,
    offset,
    ready,
    canPan,
    canZoomIn: ready && view.zoom < MAX_ZOOM,
    canZoomOut: ready && view.zoom > MIN_ZOOM,
    isDragging,
    loadError,
    zoomIn: () => stepZoom(ZOOM_STEP),
    zoomOut: () => stepZoom(-ZOOM_STEP),
    rotateLeft: () => rotate(-90),
    rotateRight: () => rotate(90),
    fitToViewport: () => setView((previous) => ({ ...previous, zoom: 1, offset: center })),
    reset: () => setView(initialImageViewerView),
    handleDoubleClick: () => {
      if (!ready) return
      setView((previous) => ({ ...previous, zoom: previous.zoom > 1 ? 1 : 2, offset: center }))
    },
    handlePointerDown,
    handlePointerMove,
    handlePointerEnd,
    handleLoad: (event: SyntheticEvent<HTMLImageElement>) => {
      const { naturalWidth: width, naturalHeight: height } = event.currentTarget
      if (width && height) setImage({ width, height })
      else setLoadError(true)
    },
    handleLoadError: () => setLoadError(true),
  }
}
