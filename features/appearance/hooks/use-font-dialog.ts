'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { api } from '@/lib/request-utils'
import { DEFAULT_FONT_SETTINGS, getBrowserFontFamily } from '@/lib/settings/font-settings'

import type { FontSourceFilter, LocalFontItem } from '../components/font-types'

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
  const currentUsesBrowser = Boolean(getBrowserFontFamily(currentFontPath))
  const [isLoadingFonts, setIsLoadingFonts] = useState(false)
  const [isImportingPath, setIsImportingPath] = useState<string | null>(null)
  const [sourceFilter, setSourceFilter] = useState<FontSourceFilter>('all')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [localFonts, setLocalFonts] = useState<LocalFontItem[]>([])
  const [followsBrowser, setFollowsBrowser] = useState(currentUsesBrowser)
  const [browserPath, setBrowserPath] = useState(DEFAULT_FONT_SETTINGS.fontPath)
  const [customPath, setCustomPath] = useState('')
  const [selectedLocalPath, setSelectedLocalPath] = useState<string | null>(null)
  const previewFontPath = followsBrowser ? browserPath : customPath
  const [importedPaths, setImportedPaths] = useState<string[]>([])

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
      const payload = response.data as { data?: { path?: string } }
      const importedPath = payload.data?.path?.trim()
      if (!importedPath) throw new Error('未获取到导入后的字体路径')

      setCustomPath(importedPath)
      setSelectedLocalPath(font.path)
      setImportedPaths((prev) => (prev.includes(importedPath) ? prev : [...prev, importedPath]))
      toast.success('字体导入成功')
    } catch (error) {
      toast.error((error as Error).message || '导入字体失败')
    } finally {
      setIsImportingPath(null)
    }
  }

  const handleChangeMode = (nextFollowsBrowser: boolean) => {
    setFollowsBrowser(nextFollowsBrowser)
    if (!nextFollowsBrowser && localFonts.length === 0 && !isLoadingFonts) void loadFonts()
  }

  const handleConfirm = async () => {
    if (isImportingPath) return
    if (!previewFontPath) {
      toast.error('请先选择字体')
      return
    }

    const removable = importedPaths.filter((path) => path !== previewFontPath)

    if (
      currentFontPath &&
      currentFontPath !== previewFontPath &&
      isImportedFontPath(currentFontPath) &&
      !removable.includes(currentFontPath)
    ) {
      removable.push(currentFontPath)
    }

    onApply(previewFontPath)
    await cleanupPaths(removable)
  }

  const handleCancel = async () => {
    if (isImportingPath) return
    await cleanupPaths(importedPaths)
    setImportedPaths([])
    onOpenChange(false)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      onOpenChange(true)
      return
    }
    void handleCancel()
  }

  // Reset state when dialog opens
  useEffect(() => {
    if (!open) return
    setFollowsBrowser(currentUsesBrowser)
    setBrowserPath(currentUsesBrowser ? currentFontPath : DEFAULT_FONT_SETTINGS.fontPath)
    setCustomPath(currentUsesBrowser ? '' : currentFontPath)
    setSelectedLocalPath(null)
    setSourceFilter('all')
    setSearchKeyword('')
    setImportedPaths([])
    if (!currentUsesBrowser) void loadFonts()
  }, [open, currentFontPath, currentUsesBrowser])

  return {
    isLoadingFonts,
    isImportingPath,
    sourceFilter,
    searchKeyword,
    localFonts,
    previewFontPath,
    followsBrowser,
    selectedLocalPath,
    setSourceFilter,
    setSearchKeyword,
    loadFonts,
    handleImport,
    handleChangeMode,
    handleSelectBrowserFont: setBrowserPath,
    handleConfirm,
    handleCancel,
    handleOpenChange,
  }
}
