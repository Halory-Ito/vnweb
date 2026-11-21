'use client'

import { useId, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import {
  BACKGROUND_NAME_MAX_LENGTH,
  getBackgroundImageExtension,
  isValidBackgroundName,
} from '@/lib/settings/background-upload-name'

import type { DeviceType } from '@/lib/settings/background-settings'

export function BackgroundUploadDialog({
  file,
  device,
  isUploading,
  onCancel,
  onConfirm,
}: {
  file: File
  device: DeviceType
  isUploading: boolean
  onCancel: () => void
  onConfirm: (name: string) => void
}) {
  const id = useId()
  const extension = getBackgroundImageExtension(file.name, file.type)
  const originalName = file.name.replace(/\.[^.]+$/, '').trim()
  const [name, setName] = useState(isValidBackgroundName(originalName) ? originalName : '')
  const isValid = isValidBackgroundName(name.trim())

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !isUploading) onCancel()
      }}
    >
      <DialogContent aria-describedby={undefined}>
        <form
          className="flex min-w-0 flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (isValid && !isUploading) onConfirm(name.trim())
          }}
        >
          <DialogHeader>
            <DialogTitle>上传背景图片</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor={id}>文件名</Label>
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>{device}-</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                id={id}
                value={name}
                maxLength={BACKGROUND_NAME_MAX_LENGTH}
                disabled={isUploading}
                placeholder="留空则使用时间戳"
                aria-invalid={!isValid}
                aria-describedby={!isValid ? `${id}-error` : undefined}
                onChange={(event) => setName(event.target.value)}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupText>{extension}</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
            {!isValid ? (
              <p id={`${id}-error`} className="text-destructive text-sm">
                仅支持文字、数字、空格、连字符和下划线。
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isUploading}>
              取消
            </Button>
            <Button type="submit" disabled={!isValid || isUploading}>
              {isUploading ? '上传中…' : '上传'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
