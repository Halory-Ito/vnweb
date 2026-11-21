'use client'

import { BrowserFontPresets } from './browser-font-presets'
import { FontListPanel } from './font-list-panel'
import { FontPreviewPanel } from './font-preview-panel'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
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
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-3xl"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>选择字体</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-3 text-sm font-medium">
              跟随浏览器字体设置
              <Switch
                checked={dialog.followsBrowser}
                disabled={dialog.isImportingPath !== null}
                onCheckedChange={dialog.handleChangeMode}
              />
            </label>
            {dialog.followsBrowser ? (
              <BrowserFontPresets
                selectedPath={dialog.previewFontPath}
                onSelect={dialog.handleSelectBrowserFont}
              />
            ) : null}
          </div>

          <Separator />

          <div className={dialog.followsBrowser ? 'grid' : 'grid gap-5 md:grid-cols-2'}>
            {dialog.followsBrowser ? null : (
              <FontListPanel
                fonts={dialog.localFonts}
                isLoading={dialog.isLoadingFonts}
                isImportingPath={dialog.isImportingPath}
                selectedPath={dialog.selectedLocalPath}
                sourceFilter={dialog.sourceFilter}
                searchKeyword={dialog.searchKeyword}
                onSourceFilterChange={dialog.setSourceFilter}
                onSearchKeywordChange={dialog.setSearchKeyword}
                onRefresh={() => void dialog.loadFonts()}
                onImport={(font) => void dialog.handleImport(font)}
              />
            )}
            <FontPreviewPanel fontPath={dialog.previewFontPath} fontWeight={currentFontWeight} />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={dialog.isImportingPath !== null}
            onClick={() => void dialog.handleCancel()}
          >
            取消
          </Button>
          <Button
            type="button"
            disabled={!dialog.previewFontPath || dialog.isImportingPath !== null}
            onClick={() => void dialog.handleConfirm()}
          >
            使用该字体
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
