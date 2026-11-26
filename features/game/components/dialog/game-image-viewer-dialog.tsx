'use client'

import { RotateCcwIcon, RotateCwIcon, Undo2Icon, ZoomInIcon, ZoomOutIcon } from 'lucide-react'
import { useState } from 'react'

import { initialImageViewerView, useImageViewer } from '../../hooks/use-image-viewer'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

import type { ImageViewerViewState } from '../../hooks/use-image-viewer'

type GameImageViewerDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  src: string
}

export function GameImageViewerDialog(props: GameImageViewerDialogProps) {
  return <ImageViewerDialog key={props.src} {...props} />
}

function ImageViewerDialog({ open, onOpenChange, title, src }: GameImageViewerDialogProps) {
  const [view, setView] = useState(initialImageViewerView)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[88dvh] max-h-[88dvh] flex-col gap-3 overflow-hidden p-4 sm:max-w-[90vw] lg:max-w-5xl">
        <ImageViewer title={title} src={src} view={view} setView={setView} />
      </DialogContent>
    </Dialog>
  )
}

function ImageViewer({
  title,
  src,
  view,
  setView,
}: { title: string; src: string } & ImageViewerViewState) {
  const {
    viewportRef,
    image,
    scale,
    zoom,
    rotation,
    offset,
    ready,
    canPan,
    canZoomIn,
    canZoomOut,
    isDragging,
    loadError,
    zoomIn,
    zoomOut,
    rotateLeft,
    rotateRight,
    fitToViewport,
    reset,
    handleDoubleClick,
    handlePointerDown,
    handlePointerMove,
    handlePointerEnd,
    handleLoad,
    handleLoadError,
  } = useImageViewer({ view, setView })

  const zoomPercent = `${Math.round(zoom * 100)}%`

  return (
    <>
      <DialogHeader className="shrink-0 pr-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <DialogTitle className="truncate">{title}</DialogTitle>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="缩小图片"
              disabled={!canZoomOut}
              onClick={zoomOut}
            >
              <ZoomOutIcon className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-w-14 tabular-nums"
              aria-label={`适应窗口，当前缩放 ${zoomPercent}`}
              disabled={!ready}
              onClick={fitToViewport}
            >
              {zoomPercent}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="放大图片"
              disabled={!canZoomIn}
              onClick={zoomIn}
            >
              <ZoomInIcon className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="逆时针旋转 90 度"
              disabled={!ready}
              onClick={rotateLeft}
            >
              <RotateCcwIcon className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="顺时针旋转 90 度"
              disabled={!ready}
              onClick={rotateRight}
            >
              <RotateCwIcon className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="重置视图"
              disabled={!ready}
              onClick={reset}
            >
              <Undo2Icon className="size-4" />
            </Button>
          </div>
        </div>
        <DialogDescription className="sr-only">{title}</DialogDescription>
      </DialogHeader>

      <div
        ref={viewportRef}
        className={cn(
          'bg-muted/20 relative grid min-h-0 flex-1 place-items-center overflow-hidden rounded-md border select-none',
          ready && 'touch-pinch-zoom',
          canPan && (isDragging ? 'cursor-grabbing' : 'cursor-grab'),
        )}
        onDoubleClick={handleDoubleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onLostPointerCapture={handlePointerEnd}
      >
        {src && !loadError ? (
          <img
            src={src}
            alt={title}
            draggable={false}
            onLoad={handleLoad}
            onError={handleLoadError}
            style={{
              width: image ? image.width * scale : 0,
              height: image ? image.height * scale : 0,
              transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom}) rotate(${rotation}deg)`,
            }}
            className="pointer-events-none absolute max-w-none"
          />
        ) : (
          <div className="text-muted-foreground text-sm">图片加载失败</div>
        )}
      </div>
    </>
  )
}
