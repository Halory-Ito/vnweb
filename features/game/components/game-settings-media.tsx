import {
  ClipboardPasteIcon,
  FolderUpIcon,
  Link2Icon,
  ScissorsIcon,
  SearchIcon,
  Trash2Icon,
} from 'lucide-react'
import { useRef } from 'react'

import { useGameMediaSettings } from '../hooks/use-game-media-settings'
import { imageFieldLabelMap, imageFieldList, type ImageField } from '../lib/game-settings-media'
import { GameSettingsMediaDialogs } from './game-settings-media-dialogs'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { buildGameImagePreviewUrl } from '@/lib/game-image-preview'

import type { GameDetail } from '@/types'

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
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={onClick}
        disabled={disabled}
        aria-label={tip}
      >
        {children}
      </Button>
    </TooltipTrigger>
    <TooltipContent>{tip}</TooltipContent>
  </Tooltip>
)

export function GameSettingsMedia({ game, gameTitle }: { game: GameDetail; gameTitle: string }) {
  const settings = useGameMediaSettings(game, gameTitle)
  const {
    fieldValueMap,
    hasPendingLocalization,
    hasChanges,
    save,
    importFromFile,
    importFromClipboard,
    importFromLink,
    openSearchImageDialog,
    openImageViewer,
    crop,
    removeImage,
  } = settings
  const fileInputRefs = useRef<Partial<Record<ImageField, HTMLInputElement | null>>>({})
  return (
    <div className="flex flex-col gap-4">
      <fieldset disabled={save.isPending} className="grid min-w-0 gap-3 sm:grid-cols-2">
        {imageFieldList.map((field) => (
          <section key={field} className="flex min-w-0 flex-col gap-3 rounded-md border p-3">
            <div className="text-sm font-medium">{imageFieldLabelMap[field]}</div>

            <div className="bg-muted/30 flex h-36 w-full items-center justify-center overflow-hidden rounded-md border">
              {fieldValueMap[field] ? (
                <button
                  type="button"
                  onClick={() => openImageViewer(field)}
                  aria-label={`查看${imageFieldLabelMap[field]}大图`}
                  className="group focus-visible:ring-ring flex h-full w-full cursor-zoom-in items-center justify-center focus-visible:ring-2 focus-visible:outline-none"
                >
                  <img
                    src={buildGameImagePreviewUrl(fieldValueMap[field])}
                    alt={`${imageFieldLabelMap[field]}预览`}
                    loading="lazy"
                    className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-[1.02]"
                  />
                </button>
              ) : (
                <div className="text-muted-foreground text-sm">暂无图片</div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <ToolbarIconButton
                tip="从文件导入"
                onClick={() => fileInputRefs.current[field]?.click()}
              >
                <FolderUpIcon className="size-4" />
              </ToolbarIconButton>

              <ToolbarIconButton tip="从剪贴板导入" onClick={() => void importFromClipboard(field)}>
                <ClipboardPasteIcon className="size-4" />
              </ToolbarIconButton>

              <ToolbarIconButton tip="从链接导入" onClick={() => importFromLink(field)}>
                <Link2Icon className="size-4" />
              </ToolbarIconButton>

              <ToolbarIconButton tip="搜索图片" onClick={() => openSearchImageDialog(field)}>
                <SearchIcon className="size-4" />
              </ToolbarIconButton>

              <ToolbarIconButton
                tip="裁剪图片"
                onClick={() => crop.cropImage(field, fieldValueMap[field])}
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
              ref={(input) => {
                fileInputRefs.current[field] = input
              }}
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
      </fieldset>
      <Button
        className="self-start"
        disabled={save.isPending || hasPendingLocalization || !hasChanges}
        onClick={() => save.mutate()}
      >
        {save.isPending ? '保存中...' : '保存'}
      </Button>
      <GameSettingsMediaDialogs settings={settings} />
    </div>
  )
}
