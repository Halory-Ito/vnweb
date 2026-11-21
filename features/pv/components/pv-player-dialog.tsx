'use client'

import { Trash2Icon } from 'lucide-react'

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

import type { GameOption, PvFormState, PvItem } from '../types'
import type { PvMetadata } from '@/types/pv'

type Props = {
  item: PvItem
  form: PvFormState
  gameOptions: GameOption[]
  isSubmitting: boolean
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
  isSubmitting,
  onClose,
  onGameIdChange,
  onNameChange,
  onUrlChange,
  onMetadataChange,
  onDuration,
  onSave,
  onDelete,
}: Props) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !isSubmitting) onClose()
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader className="min-w-0 pr-6">
          <DialogTitle className="break-words">{item.name}</DialogTitle>
          <DialogDescription>{item.gameNameCn || item.gameName}</DialogDescription>
        </DialogHeader>
        <div className="grid min-w-0 gap-5 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <PvPreviewPlayer key={item.url} item={item} onDuration={onDuration} />
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
              <PvMetadataFields value={form.metadata} onChange={onMetadataChange} />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button type="button" variant="destructive" onClick={onDelete}>
                  <Trash2Icon />
                  删除
                </Button>
                <Button type="submit">{isSubmitting ? '保存中…' : '保存修改'}</Button>
              </div>
            </fieldset>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
