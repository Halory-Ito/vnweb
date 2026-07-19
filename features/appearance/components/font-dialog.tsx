'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/request-utils'

const PREVIEW_FONT_FAMILY = 'VNWebPreviewFont'

type LocalFontItem = {
  name: string
  path: string
  source: 'system' | 'user'
}

type FontDialogProps = {
  open: boolean
  currentFontPath: string
  currentFontWeight: number
  onOpenChange: (open: boolean) => void
  onApply: (fontPath: string) => void
}

export function FontDialog({
  open,
  currentFontPath,
  currentFontWeight,
  onOpenChange,
  onApply,
}: FontDialogProps) {
  const [isLoadingFonts, setIsLoadingFonts] = useState(false)
  const [isImportingPath, setIsImportingPath] = useState<string | null>(null)
  const [sourceFilter, setSourceFilter] = useState<'all' | 'system' | 'user'>(
    'all',
  )
  const [searchKeyword, setSearchKeyword] = useState('')
  const [localFonts, setLocalFonts] = useState<LocalFontItem[]>([])
  const [previewFontPath, setPreviewFontPath] = useState(currentFontPath)
  const [previewFontName, setPreviewFontName] = useState('当前字体')
  const [isPreviewReady, setIsPreviewReady] = useState(false)
  const [importedPaths, setImportedPaths] = useState<string[]>([])
  const skipCleanupRef = useRef(false)

  const filteredFonts = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase()
    return localFonts.filter((font) => {
      if (sourceFilter !== 'all' && font.source !== sourceFilter) return false
      if (!keyword) return true
      return font.name.toLowerCase().includes(keyword)
    })
  }, [searchKeyword, sourceFilter, localFonts])

  const isImportedFontPath = (path: string) =>
    /_\d{10,14}\.[^.]+$/.test(path.replace(/\\/g, '/').split('/').pop() || '')

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
      const response = await api.post('/settings/font/import', {
        sourcePath: font.path,
      })
      const payload = response.data as {
        data?: { path?: string; name?: string }
      }
      const importedPath = payload.data?.path?.trim()
      if (!importedPath) throw new Error('未获取到导入后的字体路径')

      setPreviewFontPath(importedPath)
      setPreviewFontName(payload.data?.name || font.name)
      setImportedPaths((prev) =>
        prev.includes(importedPath) ? prev : [...prev, importedPath],
      )
      toast.success('字体导入成功')
    } catch (error) {
      toast.error((error as Error).message || '导入字体失败')
    } finally {
      setIsImportingPath(null)
    }
  }

  const handleConfirm = async () => {
    if (!previewFontPath) {
      toast.error('请先选择字体')
      return
    }

    skipCleanupRef.current = true
    const removable = importedPaths.filter((p) => p !== previewFontPath)

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
    setPreviewFontName('当前字体')
    setSourceFilter('all')
    setSearchKeyword('')
    setImportedPaths([])
    void loadFonts()
  }, [open, currentFontPath])

  // Load preview font face
  useEffect(() => {
    if (!open || !previewFontPath) {
      setIsPreviewReady(false)
      return
    }

    let cancelled = false
    const loadPreview = async () => {
      try {
        setIsPreviewReady(false)
        const safePath = previewFontPath.replace(/"/g, '')
        const fontFace = new FontFace(
          PREVIEW_FONT_FAMILY,
          `url("${safePath}")`,
        )
        const loaded = await fontFace.load()

        if (cancelled || typeof document === 'undefined') return

        for (const face of Array.from(document.fonts)) {
          if (face.family.replace(/['"]/g, '') === PREVIEW_FONT_FAMILY) {
            document.fonts.delete(face)
          }
        }
        document.fonts.add(loaded)
        setIsPreviewReady(true)
      } catch {
        if (!cancelled) setIsPreviewReady(false)
      }
    }

    void loadPreview()
    return () => {
      cancelled = true
    }
  }, [previewFontPath, open])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>选择并预览字体</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-muted-foreground text-sm">
              共 {filteredFonts.length} 个可选字体
            </p>
            <Button
              type="button"
              variant="outline"
              disabled={isLoadingFonts}
              onClick={() => void loadFonts()}
            >
              {isLoadingFonts ? '读取中...' : '刷新列表'}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={searchKeyword}
              placeholder="搜索字体名称"
              className="w-56"
              onChange={(event) => setSearchKeyword(event.target.value)}
            />
            {(['all', 'system', 'user'] as const).map((filter) => (
              <Button
                key={filter}
                type="button"
                size="sm"
                variant={sourceFilter === filter ? 'default' : 'outline'}
                onClick={() => setSourceFilter(filter)}
              >
                {filter === 'all' ? '全部' : filter === 'system' ? '系统字体' : '用户字体'}
              </Button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
            <div className="max-h-80 space-y-2 overflow-y-auto rounded-md border p-2">
              {filteredFonts.length === 0 ? (
                <div className="text-muted-foreground p-2 text-sm">
                  {isLoadingFonts ? '正在读取字体...' : '没有匹配的字体'}
                </div>
              ) : (
                filteredFonts.map((font) => (
                  <div
                    key={`${font.path}-${font.source}`}
                    className="flex items-center justify-between gap-2 rounded-md border p-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {font.name}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">
                        {font.source === 'system' ? '系统字体' : '用户安装字体'}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isImportingPath === font.path}
                      onClick={() => void handleImport(font)}
                    >
                      {isImportingPath === font.path ? '导入中...' : '导入预览'}
                    </Button>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">预览文本</p>
              <div
                className="dark:bg-input/20 rounded-md border p-4"
                style={{
                  fontFamily: `'${PREVIEW_FONT_FAMILY}', 'Microsoft YaHei', sans-serif`,
                  fontSize: '16px',
                  fontWeight: currentFontWeight,
                }}
              >
                天地玄黄，宇宙洪荒。字体预览 ABCD 1234。
              </div>
              <p className="text-muted-foreground text-xs">
                {isPreviewReady
                  ? `当前预览：${previewFontName}`
                  : '请选择字体并点击"导入预览"'}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => void handleCancel()}>
            取消
          </Button>
          <Button type="button" onClick={() => void handleConfirm()}>
            使用该字体
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
