'use client'

import { useAtom } from 'jotai'
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'

import AppearanceColorInput from './appearance-color-input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DEFAULT_FOLDER_PALETTE,
  folderPaletteAtom,
  folderPaletteModeAtom,
  MAX_FOLDER_PALETTE_SIZE,
} from '@/lib/settings/game-library-folder-colors'
import {
  DEFAULT_LAYOUT_SETTINGS,
  isFolderPaletteMode,
  type FolderPaletteMode,
} from '@/lib/settings/layout-settings'

export default function FolderPaletteEditor() {
  const [palette, setPalette] = useAtom(folderPaletteAtom)
  const [mode, setMode] = useAtom(folderPaletteModeAtom)
  const [draftMode, setDraftMode] = useState<FolderPaletteMode | null>(null)
  const selectedMode = draftMode ?? mode
  const [draft, setDraft] = useState<string[] | null>(null)
  const colors = draft ?? palette
  const changed =
    selectedMode !== mode ||
    colors.length !== palette.length ||
    colors.some((color, index) => color !== palette[index])

  function move(index: number, offset: number) {
    const next = [...colors]
    const target = index + offset
    if (target < 0 || target >= next.length) return
    const [color] = next.splice(index, 1)
    next.splice(target, 0, color)
    setDraft(next)
  }

  return (
    <fieldset className="min-w-0 space-y-3 border-t pt-4">
      <legend className="sr-only">文件夹色板</legend>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">文件夹色板</p>
        <Select
          value={selectedMode}
          onValueChange={(value) => {
            if (isFolderPaletteMode(value)) setDraftMode(value)
          }}
        >
          <SelectTrigger size="sm" aria-label="文件夹取色方式">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cycle">循环取色</SelectItem>
            <SelectItem value="random">随机取色</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <ol className="grid gap-2">
        {colors.map((color, index) => (
          <li key={index} className="flex flex-wrap items-center gap-2 rounded-md border p-2">
            <span className="text-muted-foreground w-6 text-center text-xs tabular-nums">
              {index + 1}
            </span>
            <AppearanceColorInput
              aria-label={`第 ${index + 1} 个颜色`}
              value={color}
              onChange={(event) =>
                setDraft(
                  colors.map((entry, position) =>
                    position === index ? event.target.value : entry,
                  ),
                )
              }
            />
            <span className="min-w-16 flex-1 text-xs tabular-nums">{color.toUpperCase()}</span>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label={`上移第 ${index + 1} 个颜色`}
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                <ArrowUpIcon />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label={`下移第 ${index + 1} 个颜色`}
                disabled={index === colors.length - 1}
                onClick={() => move(index, 1)}
              >
                <ArrowDownIcon />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label={`移除第 ${index + 1} 个颜色`}
                onClick={() => setDraft(colors.filter((_, position) => position !== index))}
              >
                <Trash2Icon />
              </Button>
            </div>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={colors.length >= MAX_FOLDER_PALETTE_SIZE}
          onClick={() => setDraft([...colors, '#64748b'])}
        >
          <PlusIcon /> 添加颜色
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setDraft([...DEFAULT_FOLDER_PALETTE])
            setDraftMode(DEFAULT_LAYOUT_SETTINGS.folderPaletteMode)
          }}
        >
          恢复预设
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!changed}
          onClick={() => {
            setPalette(colors)
            setMode(selectedMode)
            setDraft(null)
            setDraftMode(null)
          }}
        >
          保存色板
        </Button>
      </div>
    </fieldset>
  )
}
