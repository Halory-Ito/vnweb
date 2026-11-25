'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSetAtom } from 'jotai'
import {
  ClipboardPasteIcon,
  EyeIcon,
  FolderOpenIcon,
  FolderUpIcon,
  Loader2Icon,
  Link2Icon,
  SaveIcon,
  ScissorsIcon,
  SearchIcon,
  Trash2Icon,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import Cropper, { type Area, type Point } from 'react-easy-crop'
import { toast } from 'sonner'

import {
  enqueueGameImageLocalizationById,
  getGameById,
  selectExeFile,
  updateGameSettingsById,
} from '@/api'
import { bgAtom } from '@/atom/global'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Slider } from '@/components/ui/slider'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { GameImageSearchDialog } from '@/features/game/components/dialog/game-image-search-dialog'
import { useGameImageSearch } from '@/features/game/hooks/use-game-image-search'
import { selectDirectory } from '@/features/game/lib/scan-utils'
import { isDesktopRuntime, pickDesktopGamePath } from '@/lib/desktop-window'
import { buildGameImagePreviewUrl } from '@/lib/game-image-preview'
import {
  DEFAULT_LAST_GAME_BACKGROUND_IMAGE,
  readBackgroundSettings,
  updateLastGameBackground,
} from '@/lib/settings/background-settings'

type ImageField = 'cover' | 'bg' | 'icon' | 'logo'

type GameSettingsPanelProps = {
  gameId: number
  gameTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const imageFieldLabelMap: Record<ImageField, string> = {
  cover: '封面',
  bg: '背景',
  icon: '图标',
  logo: '徽标',
}

const imageFieldAspectMap: Record<ImageField, number> = {
  cover: 2 / 3,
  bg: 16 / 9,
  icon: 1,
  logo: 3,
}

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('读取文件失败'))
    reader.readAsDataURL(file)
  })

const loadImageElement = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () =>
      reject(
        new Error(
          '图片加载失败，可能不支持跨域裁剪，建议先点击确认保存后，再重新进入该页面进行剪切',
        ),
      )
    image.src = src
  })

const ToolbarIconButton = ({
  tip,
  onClick,
  children,
  disabled,
}: {
  tip: string
  onClick: () => void
  children: React.ReactNode
  disabled?: boolean
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button type="button" variant="outline" size="icon" onClick={onClick} disabled={disabled}>
        {children}
      </Button>
    </TooltipTrigger>
    <TooltipContent>{tip}</TooltipContent>
  </Tooltip>
)

export default function GameSettingsPanel({
  gameId,
  gameTitle,
  open,
  onOpenChange,
}: GameSettingsPanelProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const setGlobalBg = useSetAtom(bgAtom)

  const [exePath, setExePath] = useState('')
  const [saveDir, setSaveDir] = useState('')
  const [cover, setCover] = useState('')
  const [bg, setBg] = useState('')
  const [icon, setIcon] = useState('')
  const [logo, setLogo] = useState('')
  const [coverLocalized, setCoverLocalized] = useState('')
  const [bgLocalized, setBgLocalized] = useState('')
  const [iconLocalized, setIconLocalized] = useState('')
  const [logoLocalized, setLogoLocalized] = useState('')
  const [localizingMap, setLocalizingMap] = useState<Record<ImageField, boolean>>({
    cover: false,
    bg: false,
    icon: false,
    logo: false,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [searchDialogOpen, setSearchDialogOpen] = useState(false)
  const [searchTargetField, setSearchTargetField] = useState<ImageField>('cover')
  const imageSearch = useGameImageSearch(searchTargetField)
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkDialogField, setLinkDialogField] = useState<ImageField>('cover')
  const [linkInputValue, setLinkInputValue] = useState('')
  const [cropDialogOpen, setCropDialogOpen] = useState(false)
  const [cropDialogField, setCropDialogField] = useState<ImageField>('cover')
  const [cropSource, setCropSource] = useState('')
  const [cropPosition, setCropPosition] = useState<Point>({ x: 0, y: 0 })
  const [cropZoom, setCropZoom] = useState(1)
  const [cropFreeAspect, setCropFreeAspect] = useState(false)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  const fileInputRefs = {
    cover: useRef<HTMLInputElement | null>(null),
    bg: useRef<HTMLInputElement | null>(null),
    icon: useRef<HTMLInputElement | null>(null),
    logo: useRef<HTMLInputElement | null>(null),
  }
  const latestImageSelectionRef = useRef<Record<ImageField, string>>({
    cover: '',
    bg: '',
    icon: '',
    logo: '',
  })

  const { data, isFetching } = useQuery({
    queryKey: ['game', String(gameId)],
    queryFn: () => getGameById(String(gameId)),
    enabled: open,
  })

  useEffect(() => {
    if (!data) {
      return
    }

    setExePath(data.exePath || '')
    setSaveDir(data.saveDir || '')
    setCover(data.cover || '')
    setBg(data.bg || '')
    setIcon(data.icon || '')
    setLogo(data.logo || '')
    setCoverLocalized(data.cover || '')
    setBgLocalized(data.bg || '')
    setIconLocalized(data.icon || '')
    setLogoLocalized(data.logo || '')
  }, [data])

  const fieldValueMap = useMemo(
    () => ({
      cover,
      bg,
      icon,
      logo,
    }),
    [cover, bg, icon, logo],
  )

  const setImageFieldValue = (field: ImageField, value: string) => {
    if (field === 'cover') {
      setCover(value)
      return
    }
    if (field === 'bg') {
      setBg(value)
      return
    }
    if (field === 'icon') {
      setIcon(value)
      return
    }
    setLogo(value)
  }

  const setLocalizedFieldValue = (field: ImageField, value: string) => {
    if (field === 'cover') {
      setCoverLocalized(value)
      return
    }
    if (field === 'bg') {
      setBgLocalized(value)
      return
    }
    if (field === 'icon') {
      setIconLocalized(value)
      return
    }
    setLogoLocalized(value)
  }

  const isRemoteOrDataImage = (value: string) => {
    const trimmed = value.trim()
    return /^https?:\/\//i.test(trimmed) || /^data:/i.test(trimmed)
  }

  const enqueueImageLocalization = (field: ImageField, sourceValue: string) => {
    const value = sourceValue.trim()
    if (!value) {
      return
    }

    latestImageSelectionRef.current[field] = value
    setLocalizingMap((prev) => ({ ...prev, [field]: true }))

    void enqueueGameImageLocalizationById(gameId, {
      imageType: field,
      sourceUrl: value,
    })
      .then((response) => {
        const localizedPath = response.data.path || ''
        if (!localizedPath) {
          return
        }

        if (latestImageSelectionRef.current[field] !== value) {
          return
        }

        setLocalizedFieldValue(field, localizedPath)
      })
      .catch((error) => {
        const err = error as {
          response?: {
            data?: {
              error?: string
            }
          }
          message?: string
        }
        toast.error(err.response?.data?.error || err.message || '后台下载图片失败')
      })
      .finally(() => {
        setLocalizingMap((prev) => ({ ...prev, [field]: false }))
      })
  }

  const applyImageSelection = (field: ImageField, value: string) => {
    setImageFieldValue(field, value)
    const normalized = value.trim()

    if (!normalized) {
      setLocalizedFieldValue(field, '')
      setLocalizingMap((prev) => ({ ...prev, [field]: false }))
      return
    }

    if (!isRemoteOrDataImage(normalized)) {
      setLocalizedFieldValue(field, normalized)
      setLocalizingMap((prev) => ({ ...prev, [field]: false }))
      return
    }

    setLocalizedFieldValue(field, '')
    enqueueImageLocalization(field, normalized)
  }

  const triggerImportFile = (field: ImageField) => {
    fileInputRefs[field].current?.click()
  }

  const importFromFile = async (field: ImageField, file?: File) => {
    if (!file) {
      return
    }

    try {
      const dataUrl = await readFileAsDataUrl(file)
      applyImageSelection(field, dataUrl)
      toast.success(`已导入${imageFieldLabelMap[field]}`)
    } catch (error) {
      toast.error((error as Error).message || '从文件导入失败')
    }
  }

  const importFromClipboard = async (field: ImageField) => {
    try {
      if (navigator.clipboard?.read) {
        const items = await navigator.clipboard.read()
        for (const item of items) {
          const imageType = item.types.find((type) => type.startsWith('image/'))
          if (imageType) {
            const blob = await item.getType(imageType)
            const file = new File([blob], `${field}.png`, { type: blob.type })
            await importFromFile(field, file)
            return
          }
        }
      }

      if (navigator.clipboard?.readText) {
        const text = (await navigator.clipboard.readText()).trim()
        if (text) {
          applyImageSelection(field, text)
          toast.success(`已从剪贴板导入${imageFieldLabelMap[field]}链接`)
          return
        }
      }

      toast.error('剪贴板中未找到图片或链接')
    } catch (error) {
      toast.error((error as Error).message || '从剪贴板导入失败')
    }
  }

  const importFromLink = (field: ImageField) => {
    setLinkDialogField(field)
    setLinkInputValue(fieldValueMap[field])
    setLinkDialogOpen(true)
  }

  const applyLinkImport = () => {
    const nextValue = linkInputValue.trim()
    if (!nextValue) {
      toast.error('请输入图片链接')
      return
    }

    applyImageSelection(linkDialogField, nextValue)
    setLinkDialogOpen(false)
  }

  const openSearchImageDialog = (field: ImageField) => {
    setSearchTargetField(field)
    imageSearch.prepareSearch(gameTitle, field)
    setSearchDialogOpen(true)
  }

  const applySelectedSearchImage = () => {
    if (!imageSearch.selectedUrl) {
      toast.error('请先选择图片')
      return
    }

    applyImageSelection(searchTargetField, imageSearch.selectedUrl)
    setSearchDialogOpen(false)
    toast.success(`已设置${imageFieldLabelMap[searchTargetField]}`)
  }

  const viewLargeImage = (field: ImageField) => {
    const target = fieldValueMap[field]
    if (!target) {
      toast.error(`暂无${imageFieldLabelMap[field]}可查看`)
      return
    }

    window.open(target, '_blank', 'noopener,noreferrer')
  }

  const cropImage = async (field: ImageField) => {
    const target = fieldValueMap[field]
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

    ctx.drawImage(image, rect.x, rect.y, rect.w, rect.h, 0, 0, rect.w, rect.h)

    const dataUrl = canvas.toDataURL('image/png')
    applyImageSelection(cropDialogField, dataUrl)
    setCropDialogOpen(false)
    toast.success(`已裁剪${imageFieldLabelMap[cropDialogField]}`)
  }

  const removeImage = (field: ImageField) => {
    setImageFieldValue(field, '')
    setLocalizedFieldValue(field, '')
    setLocalizingMap((prev) => ({ ...prev, [field]: false }))
  }

  const handleSelectExeFile = async () => {
    try {
      const filePath = await (isDesktopRuntime()
        ? pickDesktopGamePath('executable')
        : selectExeFile())
      if (filePath) {
        setExePath(filePath)
      }
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: string } }
        message?: string
      }
      toast.error(err.response?.data?.error || err.message || '选择文件失败')
    }
  }

  const handleSelectSaveDir = async () => {
    try {
      const directory = await (isDesktopRuntime()
        ? pickDesktopGamePath('saveDirectory')
        : selectDirectory())
      if (directory) {
        setSaveDir(directory)
      }
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: string } }
        message?: string
      }
      toast.error(err.response?.data?.error || err.message || '选择目录失败')
    }
  }

  const saveSettings = async () => {
    const hasPendingLocalization = Object.values(localizingMap).some(Boolean)
    if (hasPendingLocalization) {
      toast.error('图片本地化处理中，请稍后再保存')
      return
    }

    const displayAndPersist: Array<{
      field: ImageField
      displayValue: string
      persistedValue: string
    }> = [
      { field: 'cover', displayValue: cover, persistedValue: coverLocalized },
      { field: 'bg', displayValue: bg, persistedValue: bgLocalized },
      { field: 'icon', displayValue: icon, persistedValue: iconLocalized },
      { field: 'logo', displayValue: logo, persistedValue: logoLocalized },
    ]

    for (const item of displayAndPersist) {
      const displayValue = item.displayValue.trim()
      const persistedValue = item.persistedValue.trim()
      if (displayValue && isRemoteOrDataImage(displayValue) && !persistedValue) {
        toast.error(`${imageFieldLabelMap[item.field]}尚未完成本地化，请稍后重试`)
        return
      }
    }

    setIsSaving(true)
    try {
      const nextCover = (coverLocalized || cover).trim()
      const nextBg = (bgLocalized || bg).trim()
      const nextIcon = (iconLocalized || icon).trim()
      const nextLogo = (logoLocalized || logo).trim()

      const backgroundSettings = readBackgroundSettings()
      const fallbackGlobalBackground =
        (backgroundSettings.customBackgroundEnabled &&
          backgroundSettings.customBackgroundImage.trim()) ||
        backgroundSettings.lastGameBackgroundImage.trim() ||
        DEFAULT_LAST_GAME_BACKGROUND_IMAGE
      const resolvedDisplayBg = nextBg || fallbackGlobalBackground

      await updateGameSettingsById(gameId, {
        exePath,
        saveDir,
        cover: nextCover,
        bg: nextBg,
        icon: nextIcon,
        logo: nextLogo,
      })

      queryClient.setQueryData(['game', String(gameId)], (prev: unknown) => {
        if (!prev || typeof prev !== 'object') {
          return prev
        }
        const prevGame = prev as {
          cover?: string
          bg?: string
          icon?: string
          logo?: string
          exePath?: string
          saveDir?: string
        }
        return {
          ...prevGame,
          cover: nextCover,
          bg: nextBg,
          icon: nextIcon,
          logo: nextLogo,
          exePath,
          saveDir,
        }
      })

      setGlobalBg(resolvedDisplayBg)
      if (nextBg) {
        updateLastGameBackground(nextBg)
      }

      await queryClient.invalidateQueries({
        queryKey: ['game', String(gameId)],
      })
      router.refresh()
      toast.success('设置已保存')
      onOpenChange(false)
    } catch (error) {
      const err = error as {
        response?: {
          data?: {
            error?: string
          }
        }
        message?: string
      }
      toast.error(err.response?.data?.error || err.message || '保存设置失败')
    } finally {
      setIsSaving(false)
    }
  }

  const imageFieldList: ImageField[] = ['cover', 'bg', 'icon', 'logo']

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>属性设置</SheetTitle>
          <SheetDescription>{gameTitle}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4 pb-4">
          <section className="space-y-2">
            <div className="text-sm font-medium">可执行路径</div>
            <div className="flex gap-2">
              <Input
                value={exePath}
                onChange={(event) => setExePath(event.target.value)}
                placeholder="请输入可执行文件路径，例如 E:\\Games\\Sample\\game.exe"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => void handleSelectExeFile()}
                aria-label="选择可执行文件"
              >
                <FolderOpenIcon className="size-4" />
              </Button>
            </div>
          </section>

          <section className="space-y-2">
            <div className="text-sm font-medium">存档路径</div>
            <div className="flex gap-2">
              <Input
                value={saveDir}
                onChange={(event) => setSaveDir(event.target.value)}
                placeholder="请输入游戏存档目录路径，例如 C:\\Users\\...\\Saves"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => void handleSelectSaveDir()}
                aria-label="选择存档目录"
              >
                <FolderOpenIcon className="size-4" />
              </Button>
            </div>
          </section>

          {imageFieldList.map((field) => (
            <section key={field} className="space-y-3 rounded-md border p-3">
              <div className="text-sm font-medium">{imageFieldLabelMap[field]}</div>

              <div className="bg-muted/30 flex h-36 w-full items-center justify-center overflow-hidden rounded-md border">
                {fieldValueMap[field] ? (
                  <img
                    src={buildGameImagePreviewUrl(fieldValueMap[field])}
                    alt={`${imageFieldLabelMap[field]}预览`}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="text-muted-foreground text-sm">暂无图片</div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <ToolbarIconButton tip="从文件导入" onClick={() => triggerImportFile(field)}>
                  <FolderUpIcon className="size-4" />
                </ToolbarIconButton>

                <ToolbarIconButton
                  tip="从剪贴板导入"
                  onClick={() => void importFromClipboard(field)}
                >
                  <ClipboardPasteIcon className="size-4" />
                </ToolbarIconButton>

                <ToolbarIconButton tip="从链接导入" onClick={() => importFromLink(field)}>
                  <Link2Icon className="size-4" />
                </ToolbarIconButton>

                <ToolbarIconButton tip="搜索图片" onClick={() => openSearchImageDialog(field)}>
                  <SearchIcon className="size-4" />
                </ToolbarIconButton>

                <ToolbarIconButton tip="查看大图" onClick={() => viewLargeImage(field)}>
                  <EyeIcon className="size-4" />
                </ToolbarIconButton>

                <ToolbarIconButton
                  tip="裁剪图片"
                  onClick={() => void cropImage(field)}
                  disabled={!fieldValueMap[field]}
                >
                  <ScissorsIcon className="size-4" />
                </ToolbarIconButton>

                <ToolbarIconButton
                  tip="删除图片"
                  onClick={() => removeImage(field)}
                  disabled={!fieldValueMap[field]}
                >
                  <Trash2Icon className="size-4" />
                </ToolbarIconButton>
              </div>

              <input
                ref={fileInputRefs[field]}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  void importFromFile(field, file)
                  event.currentTarget.value = ''
                }}
              />
            </section>
          ))}

          <div className="flex justify-start">
            <Button
              type="button"
              onClick={() => void saveSettings()}
              disabled={isSaving || isFetching || Object.values(localizingMap).some(Boolean)}
            >
              {isSaving ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <SaveIcon className="size-4" />
              )}
              {isSaving ? '确认中...' : '确认'}
            </Button>
          </div>
        </div>

        <GameImageSearchDialog
          open={searchDialogOpen}
          onOpenChange={setSearchDialogOpen}
          targetLabel={imageFieldLabelMap[searchTargetField]}
          imageType={searchTargetField}
          sources={imageSearch.availableSources}
          source={imageSearch.source}
          onSourceChange={imageSearch.handleSourceChange}
          keyword={imageSearch.keyword}
          onKeywordChange={imageSearch.setKeyword}
          includeNsfw={imageSearch.includeNsfw}
          onIncludeNsfwChange={imageSearch.setIncludeNsfw}
          isSearching={imageSearch.isSearching}
          matchedGameName={imageSearch.matchedGameName}
          images={imageSearch.images}
          selectedUrl={imageSearch.selectedUrl}
          onSelectUrl={imageSearch.setSelectedUrl}
          onSearch={(type) => void imageSearch.handleSearch(type)}
          onConfirm={applySelectedSearchImage}
        />

        <Dialog open={linkDialogOpen} onOpenChange={(nextOpen) => setLinkDialogOpen(nextOpen)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>导入{imageFieldLabelMap[linkDialogField]}链接</DialogTitle>
              <DialogDescription>请输入可访问的图片链接。</DialogDescription>
            </DialogHeader>

            <Input
              value={linkInputValue}
              onChange={(event) => setLinkInputValue(event.target.value)}
              placeholder="https://example.com/image.png"
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  applyLinkImport()
                }
              }}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setLinkDialogOpen(false)}>
                取消
              </Button>
              <Button type="button" onClick={applyLinkImport}>
                确定
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={cropDialogOpen} onOpenChange={(nextOpen) => setCropDialogOpen(nextOpen)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>裁剪{imageFieldLabelMap[cropDialogField]}</DialogTitle>
              <DialogDescription>拖拽移动裁剪区域，并通过滑块缩放。</DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="bg-muted/30 relative h-72 w-full overflow-hidden rounded-md border">
                {cropSource ? (
                  <Cropper
                    image={cropSource}
                    crop={cropPosition}
                    zoom={cropZoom}
                    aspect={cropFreeAspect ? undefined : imageFieldAspectMap[cropDialogField]}
                    minZoom={1}
                    maxZoom={4}
                    zoomSpeed={0.1}
                    cropShape="rect"
                    showGrid
                    onCropChange={setCropPosition}
                    onZoomChange={setCropZoom}
                    onCropComplete={(_, croppedPixels) => setCroppedAreaPixels(croppedPixels)}
                  />
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={cropFreeAspect}
                    onCheckedChange={(checked) => setCropFreeAspect(checked === true)}
                  />
                  <span>自由比例（不锁定宽高比）</span>
                </label>

                <div className="text-muted-foreground text-xs">缩放</div>
                <Slider
                  value={[cropZoom]}
                  min={1}
                  max={4}
                  step={0.01}
                  onValueChange={(value) => setCropZoom(value[0] ?? 1)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCropDialogOpen(false)}>
                取消
              </Button>
              <Button type="button" onClick={applyCropImage}>
                确定裁剪
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  )
}
