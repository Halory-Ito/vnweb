'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { api } from '@/lib/request-utils'
import { getBrowserFontLabel } from '@/lib/settings/font-settings'

import type { FontSourceFilter, LocalFontItem } from '../components/font-types'

const getDefaultPreviewName = (fontPath: string) => getBrowserFontLabel(fontPath) ?? '当前字体'

const isImportedFontPath = (path: string) =>
  /_\d{10,14}\.[^.]+$/.test(path.replace(/\\/g, '/').split('/').pop() || '')

type UseFontDialogOptions = {
  open: boolean
  currentFontPath: string
  onOpenChange: (open: boolean) => void
  onApply: (fontPath: string) => void
}

export function useFontDialog({
  open,
  currentFontPath,
  onOpenChange,
  onApply,
}: UseFontDialogOptions) {
  const [isLoadingFonts, setIsLoadingFonts] = useState(false)
  const [isImportingPath, setIsImportingPath] = useState<string | null>(null)
  const [sourceFilter, setSourceFilter] = useState<FontSourceFilter>('all')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [localFonts, setLocalFonts] = useState<LocalFontItem[]>([])
  const [previewFontPath, setPreviewFontPath] = useState(currentFontPath)
  const [previewFontName, setPreviewFontName] = useState(getDefaultPreviewName(currentFontPath))
  const [importedPaths, setImportedPaths] = useState<string[]>([])
  const skipCleanupRef = useRef(false)

  const loadFonts = async () => {
    setIsLoadingFonts(true)
    try {
      const response = await api.get('/settings/font/local-list')
      const payload = response.data as { data?: LocalFontItem[] }
      setLocalFonts(payload.data || [])
    } catch (error) {
      toast.error((error as Error).message || '读取本地字体失败')
    } finally {
      setIsLoadingFonts(false)
    }
  }

  const cleanupPaths = async (paths: string[]) => {
    if (paths.length === 0) return
    try {
      await api.post('/settings/font/cleanup', { paths })
    } catch {
      // silent
    }
  }

  const handleImport = async (font: LocalFontItem) => {
    setIsImportingPath(font.path)
    try {
      const response = await api.post('/settings/font/import', { sourcePath: font.path })
      const payload = response.data as { data?: { path?: string; name?: string } }
      const importedPath = payload.data?.path?.trim()
      if (!importedPath) throw new Error('未获取到导入后的字体路径')

      setPreviewFontPath(importedPath)
      setPreviewFontName(payload.data?.name || font.name)
      setImportedPaths((prev) => (prev.includes(importedPath) ? prev : [...prev, importedPath]))
      toast.success('字体导入成功')
    } catch (error) {
      toast.error((error as Error).message || '导入字体失败')
    } finally {
      setIsImportingPath(null)
    }
  }

  const handleSelectBrowserFont = (fontPath: string, label: string) => {
    setPreviewFontPath(fontPath)
    setPreviewFontName(label)
  }

  const handleConfirm = async () => {
    if (!previewFontPath) {
      toast.error('请先选择字体')
      return
    }

    skipCleanupRef.current = true
    const removable = importedPaths.filter((path) => path !== previewFontPath)

    if (
      currentFontPath &&
      currentFontPath !== previewFontPath &&
      isImportedFontPath(currentFontPath) &&
      !removable.includes(currentFontPath)
    ) {
      removable.push(currentFontPath)
    }

    await cleanupPaths(removable)
    onApply(previewFontPath)
  }

  const handleCancel = async () => {
    await cleanupPaths(importedPaths)
    setImportedPaths([])
    onOpenChange(false)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      onOpenChange(true)
      return
    }
    if (skipCleanupRef.current) {
      skipCleanupRef.current = false
      onOpenChange(false)
      return
    }
    void handleCancel()
  }

  // Reset state when dialog opens
  useEffect(() => {
    if (!open) return
    setPreviewFontPath(currentFontPath)
    setPreviewFontName(getDefaultPreviewName(currentFontPath))
    setSourceFilter('all')
    setSearchKeyword('')
    setImportedPaths([])
    void loadFonts()
  }, [open, currentFontPath])

  return {
    isLoadingFonts,
    isImportingPath,
    sourceFilter,
    searchKeyword,
    localFonts,
    previewFontPath,
    previewFontName,
    setSourceFilter,
    setSearchKeyword,
    loadFonts,
    handleImport,
    handleSelectBrowserFont,
    handleConfirm,
    handleCancel,
    handleOpenChange,
  }
}
