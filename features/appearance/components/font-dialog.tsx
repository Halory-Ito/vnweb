'use client'

import { BrowserFontPresets } from './browser-font-presets'
import { FontListPanel } from './font-list-panel'
import { FontPreviewPanel } from './font-preview-panel'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { useFontDialog } from '@/features/appearance/hooks/use-font-dialog'

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
  const dialog = useFontDialog({ open, currentFontPath, onOpenChange, onApply })

  return (
    <Dialog open={open} onOpenChange={dialog.handleOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>选择字体</DialogTitle>
          <DialogDescription>
            跟随浏览器字体，或从本地字体文件导入预览；确认后应用到整个界面。
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <BrowserFontPresets
            selectedPath={dialog.previewFontPath}
            onSelect={dialog.handleSelectBrowserFont}
          />

          <Separator />

          <div className="grid gap-5 md:grid-cols-2">
            <FontListPanel
              fonts={dialog.localFonts}
              isLoading={dialog.isLoadingFonts}
              isImportingPath={dialog.isImportingPath}
              sourceFilter={dialog.sourceFilter}
              searchKeyword={dialog.searchKeyword}
              onSourceFilterChange={dialog.setSourceFilter}
              onSearchKeywordChange={dialog.setSearchKeyword}
              onRefresh={() => void dialog.loadFonts()}
              onImport={(font) => void dialog.handleImport(font)}
            />
            <FontPreviewPanel
              fontPath={dialog.previewFontPath}
              fontWeight={currentFontWeight}
              label={dialog.previewFontName}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => void dialog.handleCancel()}>
            取消
          </Button>
          <Button type="button" onClick={() => void dialog.handleConfirm()}>
            使用该字体
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
