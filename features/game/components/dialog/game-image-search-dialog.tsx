'use client'

import { GameImageSearchGrid } from './game-image-search-grid'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  getGameImageSourceOption,
  isGameImageSource,
  type GameImageSource,
  type GameImageSourceOption,
  type GameImageType,
} from '@/lib/game-image-sources'

import type { GameSearchImageItem } from '@/types'

type GameImageSearchDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetLabel: string
  imageType: GameImageType
  sources: readonly GameImageSourceOption[]
  source: GameImageSource | ''
  onSourceChange: (source: GameImageSource) => void
  keyword: string
  onKeywordChange: (keyword: string) => void
  includeNsfw: boolean
  onIncludeNsfwChange: (checked: boolean) => void
  isSearching: boolean
  matchedGameName: string
  images: GameSearchImageItem[]
  selectedUrl: string
  onSelectUrl: (url: string) => void
  onSearch: (imageType: GameImageType) => void
  onConfirm: () => void
}

/** 游戏封面、背景、图标与徽标的多源检索弹窗。 */
export function GameImageSearchDialog({
  open,
  onOpenChange,
  targetLabel,
  imageType,
  sources,
  source,
  onSourceChange,
  keyword,
  onKeywordChange,
  includeNsfw,
  onIncludeNsfwChange,
  isSearching,
  matchedGameName,
  images,
  selectedUrl,
  onSelectUrl,
  onSearch,
  onConfirm,
}: GameImageSearchDialogProps) {
  const sourceOption = source ? getGameImageSourceOption(source) : null
  const hasSources = sources.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-full flex-col gap-3 overflow-hidden p-4 sm:max-w-4xl sm:gap-4 sm:p-6">
        <DialogHeader className="shrink-0 text-left">
          <DialogTitle>搜索{targetLabel}</DialogTitle>
          <DialogDescription className="sr-only">
            选择数据源并输入关键词搜索游戏媒体图片
          </DialogDescription>
        </DialogHeader>

        <GameImageSearchGrid
          imageType={imageType}
          images={images}
          isSearching={isSearching}
          selectedUrl={selectedUrl}
          onSelectUrl={onSelectUrl}
        />

        <div className="shrink-0 space-y-3 border-t pt-3">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
            <Select
              value={source || undefined}
              disabled={!hasSources}
              onValueChange={(value) => {
                if (isGameImageSource(value)) onSourceChange(value)
              }}
            >
              <SelectTrigger className="w-full shrink-0 sm:w-44">
                <SelectValue
                  placeholder={hasSources ? '选择数据源' : `未开启${targetLabel}数据源`}
                />
              </SelectTrigger>
              <SelectContent>
                {sources.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              className="min-w-0 flex-1"
              value={keyword}
              disabled={!hasSources}
              onChange={(event) => onKeywordChange(event.target.value)}
              placeholder={
                sourceOption?.placeholder ?? `请先在平台设置中开启支持${targetLabel}的数据源`
              }
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  onSearch(imageType)
                }
              }}
            />

            <Button
              type="button"
              variant="outline"
              className="w-full shrink-0 sm:w-auto"
              onClick={() => onSearch(imageType)}
              disabled={isSearching || !hasSources}
            >
              {isSearching ? '搜索中...' : '搜索'}
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="text-muted-foreground">
                {matchedGameName ? `当前匹配：${matchedGameName}` : '尚未匹配结果'}
              </span>
              {sourceOption?.supportsNsfwFilter && (
                <label className="flex cursor-pointer items-center gap-2 select-none">
                  <Checkbox
                    checked={includeNsfw}
                    onCheckedChange={(checked) => onIncludeNsfwChange(Boolean(checked))}
                  />
                  <span>包含 NSFW</span>
                </label>
              )}
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button type="button" variant="outline" onClick={onConfirm} disabled={!selectedUrl}>
                确定
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
