'use client'

import { ExternalLinkIcon, PencilIcon, Trash2Icon, XIcon } from 'lucide-react'

import { getPlayableUrl } from '../hooks/use-pv-playback'
import { PvBasicFields } from './pv-basic-fields'
import { PvMetadataFields } from './pv-metadata-fields'
import { PvPreviewPlayer } from './pv-preview-player'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

import type { GameOption, PvFormState, PvItem } from '../types'
import type { PvMetadata } from '@/types/pv'

type Props = {
  item: PvItem
  form: PvFormState
  gameOptions: GameOption[]
  categories: string[]
  editing: boolean
  isSubmitting: boolean
  onEditingChange: (editing: boolean) => void
  onClose: () => void
  onGameIdChange: (value: string) => void
  onNameChange: (value: string) => void
  onUrlChange: (value: string) => void
  onMetadataChange: (value: PvMetadata) => void
  onDuration: (duration: number) => void
  onSave: () => void
  onDelete: () => void
}

export function PvPlayerDialog({
  item,
  form,
  gameOptions,
  categories,
  editing,
  isSubmitting,
  onEditingChange,
  onClose,
  onGameIdChange,
  onNameChange,
  onUrlChange,
  onMetadataChange,
  onDuration,
  onSave,
  onDelete,
}: Props) {
  const link = getPlayableUrl(item.url)

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !isSubmitting) onClose()
      }}
    >
      <DialogContent
        className={cn('max-h-[90dvh] overflow-y-auto', editing ? 'sm:max-w-5xl' : 'sm:max-w-3xl')}
      >
        <DialogHeader className="min-w-0 pr-6">
          <DialogTitle className="break-words">{item.name}</DialogTitle>
          <DialogDescription>{item.gameNameCn || item.gameName}</DialogDescription>
        </DialogHeader>

        <div
          className={cn(
            'grid min-w-0 gap-5',
            editing && 'md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]',
          )}
        >
          <div className="flex min-w-0 flex-col gap-3">
            <PvPreviewPlayer
              key={item.url}
              item={item}
              autoPlayOnMount={!editing}
              onDuration={onDuration}
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {link && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={link} target="_blank" rel="noreferrer">
                      <ExternalLinkIcon />
                      打开原始链接
                    </a>
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onEditingChange(!editing)}
                >
                  {editing ? <XIcon /> : <PencilIcon />}
                  {editing ? '收起编辑' : '编辑信息'}
                </Button>
              </div>
              {!editing && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={onDelete}
                >
                  <Trash2Icon />
                  删除
                </Button>
              )}
            </div>
          </div>

          {editing && (
            <form
              className="min-w-0 md:border-l md:pl-5"
              onSubmit={(event) => {
                event.preventDefault()
                if (!isSubmitting) onSave()
              }}
            >
              <fieldset disabled={isSubmitting} className="flex min-w-0 flex-col gap-4">
                <legend className="mb-3 text-sm font-semibold">编辑 PV</legend>
                <PvBasicFields
                  form={form}
                  gameOptions={gameOptions}
                  onGameIdChange={onGameIdChange}
                  onNameChange={onNameChange}
                  onUrlChange={onUrlChange}
                />
                <PvMetadataFields
                  value={form.metadata}
                  categories={categories}
                  onChange={onMetadataChange}
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Button type="button" variant="destructive" onClick={onDelete}>
                    <Trash2Icon />
                    删除
                  </Button>
                  <Button type="submit">{isSubmitting ? '保存中…' : '保存修改'}</Button>
                </div>
              </fieldset>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
