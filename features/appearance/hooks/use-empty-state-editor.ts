'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'

import {
  EMPTY_STATE_IMAGE_TYPES,
  EMPTY_STATE_MAX_IMAGE_BYTES,
  EMPTY_STATE_MAX_ITEMS,
  isEmptyStateImageUrl,
  updateEmptyStateSettings,
} from '@/lib/settings/empty-state-settings'

import type { EmptyStateSettings } from '@/lib/settings/empty-state-settings'

type ItemKey = 'kaomoji' | 'images'

function readImage(file: File) {
  if (!EMPTY_STATE_IMAGE_TYPES.includes(file.type))
    throw new Error('请选择 PNG、JPEG、WebP、GIF 或 AVIF 图片。')
  if (file.size === 0 || file.size > EMPTY_STATE_MAX_IMAGE_BYTES)
    throw new Error('每张本地图片须小于或等于 256 KB。')
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('无法读取图片。'))
    reader.onabort = () => reject(new Error('图片读取已取消。'))
    reader.readAsDataURL(file)
  })
}

export function saveEmptyStateSettings(
  update: (current: EmptyStateSettings) => EmptyStateSettings,
) {
  try {
    updateEmptyStateSettings(update)
    return true
  } catch (error) {
    toast.error(error instanceof Error ? error.message : '空状态设置保存失败。')
    return false
  }
}

export function useEmptyStateEditor(itemKey: ItemKey) {
  const [draft, setDraft] = useState('')
  const [isReading, setIsReading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function addItems(values: string[]) {
    return saveEmptyStateSettings((current) => {
      const items = [...new Set([...current[itemKey], ...values])]
      if (items.length > EMPTY_STATE_MAX_ITEMS)
        throw new Error(`每组最多添加 ${EMPTY_STATE_MAX_ITEMS} 项。`)
      return { ...current, [itemKey]: items }
    })
  }

  function addDraft() {
    const value = draft.trim()
    if (!value) return
    if (itemKey === 'images' && !isEmptyStateImageUrl(value)) {
      toast.error('请输入 HTTP、HTTPS 图片链接或站内图片路径。')
      return
    }
    if (addItems([value])) setDraft('')
  }

  async function addFiles(files: FileList) {
    if (!files.length) return
    if (files.length > EMPTY_STATE_MAX_ITEMS) {
      toast.error(`一次最多选择 ${EMPTY_STATE_MAX_ITEMS} 张图片。`)
      return
    }
    setIsReading(true)
    try {
      const selected = Array.from(files)
      addItems(await Promise.all(selected.map(readImage)))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '无法读取图片。')
    } finally {
      setIsReading(false)
    }
  }

  function remove(value: string) {
    saveEmptyStateSettings((current) => ({
      ...current,
      [itemKey]: current[itemKey].filter((item) => item !== value),
    }))
  }

  return { draft, setDraft, inputRef, isReading, addDraft, addFiles, remove }
}
