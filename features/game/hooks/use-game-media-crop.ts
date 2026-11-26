import { useState } from 'react'
import { toast } from 'sonner'

import { imageFieldLabelMap, loadImageElement, type ImageField } from '../lib/game-settings-media'
import { buildGameImagePreviewUrl } from '@/lib/game-image-preview'

import type { Area, Point } from 'react-easy-crop'

export function useGameMediaCrop(applyImageSelection: (field: ImageField, value: string) => void) {
  const [cropDialogOpen, setCropDialogOpen] = useState(false)
  const [cropDialogField, setCropDialogField] = useState<ImageField>('cover')
  const [cropSource, setCropSource] = useState('')
  const [cropPosition, setCropPosition] = useState<Point>({ x: 0, y: 0 })
  const [cropZoom, setCropZoom] = useState(1)
  const [cropFreeAspect, setCropFreeAspect] = useState(false)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  const cropImage = (field: ImageField, value: string) => {
    const target = value
    if (!target) {
      toast.error(`暂无${imageFieldLabelMap[field]}可裁剪`)
      return
    }

    setCropDialogField(field)
    setCropSource(buildGameImagePreviewUrl(target))
    setCropPosition({ x: 0, y: 0 })
    setCropZoom(1)
    setCropFreeAspect(false)
    setCroppedAreaPixels(null)
    setCropDialogOpen(true)
  }

  const applyCropImage = async () => {
    if (!cropSource) {
      toast.error('裁剪失败：图片未准备好')
      return
    }

    if (!croppedAreaPixels) {
      toast.error('裁剪失败：请先调整裁剪区域')
      return
    }

    let image: HTMLImageElement
    try {
      image = await loadImageElement(cropSource)
    } catch (error) {
      toast.error((error as Error).message || '图片加载失败，无法裁剪')
      return
    }

    const rect = {
      x: Math.max(0, Math.floor(croppedAreaPixels.x)),
      y: Math.max(0, Math.floor(croppedAreaPixels.y)),
      w: Math.max(1, Math.floor(croppedAreaPixels.width)),
      h: Math.max(1, Math.floor(croppedAreaPixels.height)),
    }

    const canvas = document.createElement('canvas')
    canvas.width = rect.w
    canvas.height = rect.h
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      toast.error('裁剪失败：无法创建画布')
      return
    }

    try {
      ctx.drawImage(image, rect.x, rect.y, rect.w, rect.h, 0, 0, rect.w, rect.h)
      applyImageSelection(cropDialogField, canvas.toDataURL('image/png'))
      setCropDialogOpen(false)
      toast.success(`已裁剪${imageFieldLabelMap[cropDialogField]}`)
    } catch (error) {
      toast.error((error as Error).message || '裁剪失败')
    }
  }

  return {
    cropImage,
    applyCropImage,
    cropDialogOpen,
    setCropDialogOpen,
    cropDialogField,
    cropSource,
    cropPosition,
    setCropPosition,
    cropZoom,
    setCropZoom,
    cropFreeAspect,
    setCropFreeAspect,
    setCroppedAreaPixels,
  }
}
