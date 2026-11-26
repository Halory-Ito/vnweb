import Cropper from 'react-easy-crop'

import { imageFieldAspectMap, imageFieldLabelMap } from '../lib/game-settings-media'
import { GameImageSearchDialog } from './dialog/game-image-search-dialog'
import { GameImageViewerDialog } from './dialog/game-image-viewer-dialog'
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
import { Slider } from '@/components/ui/slider'
import { buildGameImagePreviewUrl } from '@/lib/game-image-preview'

import type { useGameMediaSettings } from '../hooks/use-game-media-settings'

export function GameSettingsMediaDialogs({
  settings,
}: {
  settings: ReturnType<typeof useGameMediaSettings>
}) {
  const {
    fieldValueMap,
    searchDialogOpen,
    setSearchDialogOpen,
    searchTargetField,
    imageSearch,
    applySelectedSearchImage,
    linkDialogOpen,
    setLinkDialogOpen,
    linkDialogField,
    linkInputValue,
    setLinkInputValue,
    applyLinkImport,
    viewerOpen,
    setViewerOpen,
    viewerField,
    crop,
  } = settings
  const {
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
    applyCropImage,
  } = crop
  return (
    <>
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

      <GameImageViewerDialog
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        title={`${imageFieldLabelMap[viewerField]}预览`}
        src={fieldValueMap[viewerField] ? buildGameImagePreviewUrl(fieldValueMap[viewerField]) : ''}
      />
    </>
  )
}
