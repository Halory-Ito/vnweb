'use client'

import { ImageIcon, Trash2Icon } from 'lucide-react'
import { useId } from 'react'

import { GameMemoryMetadataFields } from './game-memory-metadata-fields'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import type { MemoryFrontmatterEntry } from '../../lib/memory-frontmatter'

type GameMemoryFormDialogProps = {
  mode: 'create' | 'edit'
  gameId: number
  open: boolean
  isSaving: boolean
  imagePreviewUrl: string
  title: string
  summary: string
  tagsInput: string
  ostSongIds: number[]
  metadataValues: Record<string, string>
  extraEntries: MemoryFrontmatterEntry[]
  body: string
  onOpenChange: (open: boolean) => void
  onSelectImage: (file: File | null) => void
  onClearImage: () => void
  onTitleChange: (value: string) => void
  onSummaryChange: (value: string) => void
  onTagsInputChange: (value: string) => void
  onOstSongIdsChange: (ids: number[]) => void
  onMetadataValueChange: (key: string, value: string) => void
  onExtraEntriesChange: (entries: MemoryFrontmatterEntry[]) => void
  onBodyChange: (value: string) => void
  onSubmit: () => void
}

export function GameMemoryFormDialog({
  mode,
  gameId,
  open,
  isSaving,
  imagePreviewUrl,
  title,
  summary,
  tagsInput,
  ostSongIds,
  metadataValues,
  extraEntries,
  body,
  onOpenChange,
  onSelectImage,
  onClearImage,
  onTitleChange,
  onSummaryChange,
  onTagsInputChange,
  onOstSongIdsChange,
  onMetadataValueChange,
  onExtraEntriesChange,
  onBodyChange,
  onSubmit,
}: GameMemoryFormDialogProps) {
  const titleId = useId()
  const bodyId = useId()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85dvh] w-full max-w-[calc(100%-2rem)] flex-col overflow-hidden sm:max-w-2xl">
        <DialogHeader className="shrink-0">
          <DialogTitle>{mode === 'create' ? '新增游戏回忆' : '编辑游戏回忆'}</DialogTitle>
          <DialogDescription className="sr-only">
            填写回忆截图、标题、元数据与正文内容
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-2 py-1.5">
          <div className="space-y-2.5">
            <Label required={mode === 'create'}>截图</Label>

            {imagePreviewUrl ? (
              <div className="group relative aspect-video max-h-52 w-full overflow-hidden rounded-xl border">
                <img
                  src={imagePreviewUrl}
                  alt="截图预览"
                  className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  aria-label="删除截图"
                  className="absolute top-2 right-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                  onClick={onClearImage}
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </div>
            ) : (
              <div className="border-border hover:border-primary/50 rounded-xl border-2 border-dashed transition-colors duration-200">
                <label className="flex cursor-pointer flex-col items-center justify-center p-8">
                  <ImageIcon className="text-muted-foreground mb-2 size-10" />
                  <span className="text-muted-foreground text-sm">点击上传截图</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) => {
                      onSelectImage(event.target.files?.[0] ?? null)
                    }}
                  />
                </label>
              </div>
            )}
          </div>

          <div className="space-y-2.5">
            <Label htmlFor={titleId}>标题</Label>
            <Input
              id={titleId}
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="给这个回忆起个名字..."
            />
          </div>

          <GameMemoryMetadataFields
            gameId={gameId}
            summary={summary}
            tagsInput={tagsInput}
            ostSongIds={ostSongIds}
            metadataValues={metadataValues}
            extraEntries={extraEntries}
            onSummaryChange={onSummaryChange}
            onTagsInputChange={onTagsInputChange}
            onOstSongIdsChange={onOstSongIdsChange}
            onMetadataValueChange={onMetadataValueChange}
            onExtraEntriesChange={onExtraEntriesChange}
          />

          <div className="space-y-2.5">
            <Label htmlFor={bodyId}>正文内容</Label>
            <Textarea
              id={bodyId}
              value={body}
              onChange={(event) => onBodyChange(event.target.value)}
              className="field-sizing-fixed max-h-64 min-h-40 resize-none overflow-y-auto text-sm"
              placeholder="记录你的游戏体验，支持 Markdown 语法..."
            />
          </div>
        </div>

        <DialogFooter className="shrink-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button type="button" variant="outline" disabled={isSaving} onClick={onSubmit}>
            {isSaving ? '保存中...' : '保存回忆'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
