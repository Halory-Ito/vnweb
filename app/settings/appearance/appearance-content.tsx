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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { api } from '@/lib/request-utils'
import {
  BACKGROUND_TRANSITION_STYLE_OPTIONS,
  DEFAULT_BACKGROUND_SETTINGS,
  normalizeBackgroundSettings,
  notifyBackgroundSettingsChanged,
  readBackgroundSettings,
  writeBackgroundSettings,
} from '@/lib/settings/background-settings'
import {
  applyFontSettingsToDocument,
  DEFAULT_FONT_SETTINGS,
  normalizeFontSettings,
  notifyFontSettingsChanged,
  readFontSettings,
  writeFontSettings,
} from '@/lib/settings/font-settings'
import {
  applyGlassSettingsToDocument,
  DEFAULT_GLASS_SETTINGS,
  normalizeGlassSettings,
  notifyGlassSettingsChanged,
  readGlassSettings,
  writeGlassSettings,
} from '@/lib/settings/glass-settings'

type LocalFontItem = {
  name: string
  path: string
  source: 'system' | 'user'
}

const PREVIEW_FONT_FAMILY = 'VNWebPreviewFont'

const getFontNameFromPath = (fontPath: string) => {
  const normalized = fontPath.replace(/\\/g, '/')
  const fileName = normalized.split('/').pop() || normalized
  const withoutExt = fileName.replace(/\.[^.]+$/, '') || fileName
  return withoutExt.replace(/_\d{10,14}$/, '')
}

const isImportedFontPath = (fontPath: string) => {
  const normalized = fontPath.replace(/\\/g, '/')
  const fileName = normalized.split('/').pop() || normalized
  return /_\d{10,14}\.[^.]+$/.test(fileName)
}

export default function AppearanceContent() {
  const [glassSettings, setGlassSettings] = useState(DEFAULT_GLASS_SETTINGS)
  const [backgroundSettings, setBackgroundSettings] = useState(
    DEFAULT_BACKGROUND_SETTINGS,
  )
  const [fontSettings, setFontSettings] = useState(DEFAULT_FONT_SETTINGS)

  const [isUploadingBackground, setIsUploadingBackground] = useState(false)
  const backgroundFileInputRef = useRef<HTMLInputElement>(null)

  const [fontDialogOpen, setFontDialogOpen] = useState(false)
  const [isLoadingLocalFonts, setIsLoadingLocalFonts] = useState(false)
  const [isImportingFontPath, setIsImportingFontPath] = useState<string | null>(
    null,
  )
  const [fontSourceFilter, setFontSourceFilter] = useState<
    'all' | 'system' | 'user'
  >('all')
  const [fontSearchKeyword, setFontSearchKeyword] = useState('')
  const [localFonts, setLocalFonts] = useState<LocalFontItem[]>([])
  const [previewFontPath, setPreviewFontPath] = useState(
    DEFAULT_FONT_SETTINGS.fontPath,
  )
  const [previewFontName, setPreviewFontName] = useState('当前字体')
  const [isPreviewFontReady, setIsPreviewFontReady] = useState(false)
  const [previewImportedPaths, setPreviewImportedPaths] = useState<string[]>([])
  const skipCancelCleanupRef = useRef(false)

  const filteredLocalFonts = useMemo(() => {
    const keyword = fontSearchKeyword.trim().toLowerCase()

    return localFonts.filter((font) => {
      if (fontSourceFilter !== 'all' && font.source !== fontSourceFilter) {
        return false
      }

      if (!keyword) {
        return true
      }

      return font.name.toLowerCase().includes(keyword)
    })
  }, [fontSearchKeyword, fontSourceFilter, localFonts])

  useEffect(() => {
    const savedSettings = readGlassSettings()
    const savedBackgroundSettings = readBackgroundSettings()
    const savedFontSettings = readFontSettings()

    setGlassSettings(savedSettings)
    setBackgroundSettings(savedBackgroundSettings)
    setFontSettings(savedFontSettings)

    applyGlassSettingsToDocument(savedSettings)
    void applyFontSettingsToDocument(savedFontSettings)
  }, [])

  useEffect(() => {
    if (!previewFontPath) {
      setIsPreviewFontReady(false)
      return
    }

    let cancelled = false
    const loadPreviewFont = async () => {
      try {
        setIsPreviewFontReady(false)
        const safePath = previewFontPath.replace(/"/g, '')
        const fontFace = new FontFace(PREVIEW_FONT_FAMILY, `url("${safePath}")`)
        const loaded = await fontFace.load()

        if (cancelled || typeof document === 'undefined') {
          return
        }

        for (const face of Array.from(document.fonts)) {
          if (face.family.replace(/['"]/g, '') === PREVIEW_FONT_FAMILY) {
            document.fonts.delete(face)
          }
        }

        document.fonts.add(loaded)
        setIsPreviewFontReady(true)
      } catch {
        if (!cancelled) {
          setIsPreviewFontReady(false)
        }
      }
    }

    void loadPreviewFont()

    return () => {
      cancelled = true
    }
  }, [previewFontPath])

  const updateGlassSettings = (next: Partial<typeof glassSettings>) => {
    const normalized = normalizeGlassSettings({ ...glassSettings, ...next })
    setGlassSettings(normalized)
    writeGlassSettings(normalized)
    applyGlassSettingsToDocument(normalized)
    notifyGlassSettingsChanged()
  }

  const updateFontSettings = (next: Partial<typeof fontSettings>) => {
    const normalized = normalizeFontSettings({ ...fontSettings, ...next })
    setFontSettings(normalized)
    writeFontSettings(normalized)
    void applyFontSettingsToDocument(normalized)
    notifyFontSettingsChanged()
  }

  const updateBackgroundSettings = (
    next: Partial<typeof backgroundSettings>,
  ) => {
    const normalized = normalizeBackgroundSettings({
      ...backgroundSettings,
      ...next,
    })
    setBackgroundSettings(normalized)
    writeBackgroundSettings(normalized)
    notifyBackgroundSettingsChanged()
  }

  const handlePickBackgroundFile = () => {
    backgroundFileInputRef.current?.click()
  }

  const handleBackgroundFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const input = event.currentTarget
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    setIsUploadingBackground(true)
    try {
      const response = await api.post('/settings/background/upload', formData)
      const payload = response.data as {
        data?: {
          path?: string
        }
      }

      const uploadedPath = payload.data?.path?.trim()
      if (!uploadedPath) {
        throw new Error('未获取到上传后的背景路径')
      }

      updateBackgroundSettings({ customBackgroundImage: uploadedPath })
      toast.success('背景图片上传成功')
    } catch (error) {
      toast.error((error as Error).message || '上传背景图片失败')
    } finally {
      setIsUploadingBackground(false)
      input.value = ''
    }
  }

  const loadLocalFonts = async () => {
    setIsLoadingLocalFonts(true)
    try {
      const response = await api.get('/settings/font/local-list')
      const payload = response.data as {
        data?: LocalFontItem[]
      }

      setLocalFonts(payload.data || [])
    } catch (error) {
      toast.error((error as Error).message || '读取本地字体失败')
    } finally {
      setIsLoadingLocalFonts(false)
    }
  }

  const openFontDialog = () => {
    setPreviewFontPath(fontSettings.fontPath)
    setPreviewFontName('当前字体')
    setFontSourceFilter('all')
    setFontSearchKeyword('')
    setPreviewImportedPaths([])
    setFontDialogOpen(true)
    void loadLocalFonts()
  }

  const cleanupPreviewFonts = async (paths: string[]) => {
    if (paths.length === 0) {
      return
    }

    try {
      await api.post('/settings/font/cleanup', { paths })
    } catch {
      // Silent cleanup failure; stale files can be cleaned up in later operations.
    }
  }

  const handleImportAndPreviewFont = async (font: LocalFontItem) => {
    setIsImportingFontPath(font.path)
    try {
      const response = await api.post('/settings/font/import', {
        sourcePath: font.path,
      })
      const payload = response.data as {
        data?: {
          path?: string
          name?: string
        }
      }

      const importedPath = payload.data?.path?.trim()
      if (!importedPath) {
        throw new Error('未获取到导入后的字体路径')
      }

      setPreviewFontPath(importedPath)
      setPreviewFontName(payload.data?.name || font.name)
      setPreviewImportedPaths((prev) =>
        prev.includes(importedPath) ? prev : [...prev, importedPath],
      )
      toast.success('字体导入成功')
    } catch (error) {
      toast.error((error as Error).message || '导入字体失败')
    } finally {
      setIsImportingFontPath(null)
    }
  }

  const confirmUsePreviewFont = async () => {
    if (!previewFontPath) {
      toast.error('请先选择字体')
      return
    }

    skipCancelCleanupRef.current = true
    const removablePaths = previewImportedPaths.filter(
      (item) => item !== previewFontPath,
    )

    const oldFontPath = fontSettings.fontPath
    if (
      oldFontPath &&
      oldFontPath !== previewFontPath &&
      isImportedFontPath(oldFontPath) &&
      !removablePaths.includes(oldFontPath)
    ) {
      removablePaths.push(oldFontPath)
    }

    await cleanupPreviewFonts(removablePaths)

    updateFontSettings({ fontPath: previewFontPath })
    setPreviewImportedPaths([])
    setFontDialogOpen(false)
    toast.success('字体已应用')
  }

  const closeFontDialogWithCleanup = async () => {
    await cleanupPreviewFonts(previewImportedPaths)
    setPreviewImportedPaths([])
    setFontDialogOpen(false)
  }

  const handleFontDialogOpenChange = (open: boolean) => {
    if (open) {
      setFontDialogOpen(true)
      return
    }

    if (skipCancelCleanupRef.current) {
      skipCancelCleanupRef.current = false
      setFontDialogOpen(false)
      return
    }

    void closeFontDialogWithCleanup()
  }

  return (
    <div className="space-y-6">
      <div className="dark:border-input dark:bg-input/20 space-y-6 rounded-xl border p-6">
        <div>
          <p className="text-base font-semibold">字体</p>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium">当前字体</p>
            <p
              className="text-muted-foreground truncate text-xs"
              title={fontSettings.fontPath}
            >
              {getFontNameFromPath(fontSettings.fontPath)}
            </p>
          </div>
          <Button type="button" variant="outline" onClick={openFontDialog}>
            选择字体
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">字体粗细</span>
            <span className="text-muted-foreground text-sm">
              {fontSettings.fontWeight}
            </span>
          </div>
          <Slider
            min={100}
            max={900}
            step={100}
            value={[fontSettings.fontWeight]}
            onValueChange={(value) =>
              updateFontSettings({ fontWeight: value[0] ?? 400 })
            }
          />
        </div>
      </div>

      <div className="dark:border-input dark:bg-input/20 space-y-6 rounded-xl border p-6">
        <div>
          <p className="text-base font-semibold">背景</p>
          <p className="text-muted-foreground mt-1 text-sm">
            关闭时自动使用最近一次游戏背景；开启后优先使用你选择的自定义背景。
          </p>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">启用自定义背景</p>
            <p className="text-muted-foreground text-xs">
              默认关闭。进入游戏详情页时会显示该游戏自己的背景。
            </p>
          </div>
          <Switch
            checked={backgroundSettings.customBackgroundEnabled}
            onCheckedChange={(checked) =>
              updateBackgroundSettings({
                customBackgroundEnabled: checked,
              })
            }
          />
        </div>

        <div className="flex items-center justify-between space-y-2">
          <span className="text-sm font-medium">自定义背景图片</span>
          <input
            ref={backgroundFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              void handleBackgroundFileChange(event)
            }}
          />
          <Button
            type="button"
            variant="outline"
            disabled={isUploadingBackground}
            onClick={handlePickBackgroundFile}
          >
            {isUploadingBackground ? '上传中...' : '选择图片'}
          </Button>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">切换动画样式</p>
            <p className="text-muted-foreground text-xs">
              设置背景图片切换时的过渡效果。
            </p>
          </div>
          <div>
            <Select
              value={backgroundSettings.transitionStyle}
              onValueChange={(value) =>
                updateBackgroundSettings({
                  transitionStyle:
                    value as (typeof backgroundSettings)['transitionStyle'],
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="选择动画样式" />
              </SelectTrigger>
              <SelectContent>
                {BACKGROUND_TRANSITION_STYLE_OPTIONS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">过渡时长</span>
            <span className="text-muted-foreground text-sm">
              {backgroundSettings.transitionDurationMs}ms
            </span>
          </div>
          <Slider
            min={0}
            max={3000}
            step={50}
            value={[backgroundSettings.transitionDurationMs]}
            onValueChange={(value) =>
              updateBackgroundSettings({
                transitionDurationMs: value[0] ?? 0,
              })
            }
          />
        </div>
      </div>

      <div className="dark:border-input dark:bg-input/20 space-y-6 rounded-xl border p-6">
        <div>
          <p className="text-base font-semibold">毛玻璃</p>
          <p className="text-muted-foreground mt-1 text-sm">
            调整全局毛玻璃模糊与透明度，设置将实时应用到所有页面。
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">模糊度</span>
            <span className="text-muted-foreground text-sm">
              {glassSettings.blur}px
            </span>
          </div>
          <Slider
            min={0}
            max={150}
            step={1}
            value={[glassSettings.blur]}
            onValueChange={(value) =>
              updateGlassSettings({ blur: value[0] ?? 0 })
            }
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">透明度</span>
            <span className="text-muted-foreground text-sm">
              {glassSettings.opacity}%
            </span>
          </div>
          <Slider
            min={0}
            max={100}
            step={1}
            value={[glassSettings.opacity]}
            onValueChange={(value) =>
              updateGlassSettings({ opacity: value[0] ?? 0 })
            }
          />
        </div>
      </div>

      <Dialog open={fontDialogOpen} onOpenChange={handleFontDialogOpenChange}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>选择并预览字体</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-muted-foreground text-sm">
                共 {filteredLocalFonts.length} 个可选字体
              </p>
              <Button
                type="button"
                variant="outline"
                disabled={isLoadingLocalFonts}
                onClick={() => void loadLocalFonts()}
              >
                {isLoadingLocalFonts ? '读取中...' : '刷新列表'}
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={fontSearchKeyword}
                placeholder="搜索字体名称"
                className="w-56"
                onChange={(event) => setFontSearchKeyword(event.target.value)}
              />
              <Button
                type="button"
                size="sm"
                variant={fontSourceFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setFontSourceFilter('all')}
              >
                全部
              </Button>
              <Button
                type="button"
                size="sm"
                variant={fontSourceFilter === 'system' ? 'default' : 'outline'}
                onClick={() => setFontSourceFilter('system')}
              >
                系统字体
              </Button>
              <Button
                type="button"
                size="sm"
                variant={fontSourceFilter === 'user' ? 'default' : 'outline'}
                onClick={() => setFontSourceFilter('user')}
              >
                用户字体
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
              <div className="max-h-80 space-y-2 overflow-y-auto rounded-md border p-2">
                {filteredLocalFonts.length === 0 ? (
                  <div className="text-muted-foreground p-2 text-sm">
                    {isLoadingLocalFonts ? '正在读取字体...' : '没有匹配的字体'}
                  </div>
                ) : (
                  filteredLocalFonts.map((font) => (
                    <div
                      key={`${font.path}-${font.source}`}
                      className="flex items-center justify-between gap-2 rounded-md border p-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {font.name}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {font.source === 'system'
                            ? '系统字体'
                            : '用户安装字体'}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isImportingFontPath === font.path}
                        onClick={() => void handleImportAndPreviewFont(font)}
                      >
                        {isImportingFontPath === font.path
                          ? '导入中...'
                          : '导入预览'}
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
                    fontWeight: fontSettings.fontWeight,
                  }}
                >
                  天地玄黄，宇宙洪荒。字体预览 ABCD 1234。
                </div>
                <p className="text-muted-foreground text-xs">
                  {isPreviewFontReady
                    ? `当前预览：${previewFontName}`
                    : '请选择字体并点击“导入预览”'}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => void closeFontDialogWithCleanup()}
            >
              取消
            </Button>
            <Button type="button" onClick={() => void confirmUsePreviewFont()}>
              使用该字体
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
