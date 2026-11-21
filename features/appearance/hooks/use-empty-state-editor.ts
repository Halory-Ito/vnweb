'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { isAppearanceImageUrl, readLocalAppearanceImage } from '@/lib/settings/appearance-image'
import {
  EMPTY_STATE_MAX_ITEMS,
  updateEmptyStateSettings,
} from '@/lib/settings/empty-state-settings'

import type { EmptyStateSettings } from '@/lib/settings/empty-state-settings'

type ItemKey = 'kaomoji' | 'images'

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
    if (itemKey === 'images' && !isAppearanceImageUrl(value)) {
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
      addItems(await Promise.all(selected.map(readLocalAppearanceImage)))
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
