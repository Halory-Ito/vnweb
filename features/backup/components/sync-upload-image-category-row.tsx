'use client'

import { ChevronDownIcon, ImageIcon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Label } from '@/components/ui/label'
import { formatBackupSize } from '@/features/backup/lib/format-backup-size'
import { countSelectedImageCategories, getImagesSelectionState } from '@/lib/backup-content'
import { cn } from '@/lib/utils'

import type { BackupImageCategoryKey, SyncUploadPreviewSummary } from '@/types'

type Props = {
  summary: SyncUploadPreviewSummary['images']
  selectedImages: Record<BackupImageCategoryKey, boolean>
  selectedSize: number
  selectedFiles: number
  totalSelectedSize: number
  color: string
  onToggleAll: (checked: boolean) => void
  onToggleItem: (key: BackupImageCategoryKey, checked: boolean) => void
}

export function SyncUploadImageCategoryRow({
  summary,
  selectedImages,
  selectedSize,
  selectedFiles,
  totalSelectedSize,
  color,
  onToggleAll,
  onToggleItem,
}: Props) {
  const [expanded, setExpanded] = useState(false)

  const selectionState = getImagesSelectionState(selectedImages)
  const selectedCount = countSelectedImageCategories(selectedImages)
  const percent =
    totalSelectedSize > 0 ? Number(((selectedSize / totalSelectedSize) * 100).toFixed(1)) : 0

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded} className="py-2.5">
      <div className="flex min-h-10 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <Checkbox
            aria-label="选择全部图片分类"
            checked={selectionState}
            onCheckedChange={(checked) => onToggleAll(checked === true)}
          />
          <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
          <ImageIcon className="text-muted-foreground size-4 shrink-0" />
          <CollapsibleTrigger asChild>
            <button type="button" className="min-w-0 text-left">
              <p className="truncate text-sm font-medium">{summary.label}</p>
              <p className="text-muted-foreground truncate text-xs tabular-nums">
                已选 {selectedCount}/{summary.items.length} · {selectedFiles} 个文件
              </p>
            </button>
          </CollapsibleTrigger>
        </div>

        <div className="flex shrink-0 items-center gap-2 text-right tabular-nums">
          <span className="text-sm font-medium">{formatBackupSize(selectedSize)}</span>
          {totalSelectedSize > 0 && selectedCount > 0 ? (
            <span className="text-muted-foreground text-xs">{percent}%</span>
          ) : null}
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              aria-label={expanded ? '收起图片明细' : '展开图片明细'}
            >
              <ChevronDownIcon
                className={cn('size-3.5 transition-transform', expanded && 'rotate-180')}
              />
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>

      <CollapsibleContent>
        <div className="border-border/50 mt-2 ml-6 space-y-1 border-l pb-1 pl-3">
          {summary.items.map((item) => {
            const checked = selectedImages[item.key]
            const id = `sync-preview-img-${item.key}`
            return (
              <div
                key={item.key}
                className={cn(
                  'flex min-h-7 items-center justify-between gap-2 text-xs',
                  (!checked || item.size === 0) && 'opacity-55',
                )}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Checkbox
                    id={id}
                    checked={checked}
                    onCheckedChange={(next) => onToggleItem(item.key, next === true)}
                  />
                  <Label htmlFor={id} className="cursor-pointer truncate text-xs font-normal">
                    {item.label}
                  </Label>
                  <span className="text-muted-foreground shrink-0 tabular-nums">
                    {item.fileCount} 个
                  </span>
                </div>
                <span className="shrink-0 font-medium tabular-nums">
                  {formatBackupSize(item.size)}
                </span>
              </div>
            )
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
