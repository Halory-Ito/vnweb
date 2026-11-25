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
  isValidStartupMediaName,
  STARTUP_MEDIA_NAME_MAX_LENGTH,
} from '@/lib/settings/startup-upload-name'

export function StartupMediaNameDialog({
  mode,
  initialName,
  extension,
  isSubmitting,
  onCancel,
  onConfirm,
}: {
  mode: 'upload' | 'rename'
  initialName: string
  extension: string
  isSubmitting: boolean
  onCancel: () => void
  onConfirm: (name: string) => void
}) {
  const id = useId()
  const [name, setName] = useState(initialName)
  const trimmed = name.trim()
  const isValid =
    mode === 'upload'
      ? isValidStartupMediaName(trimmed)
      : trimmed.length > 0 && isValidStartupMediaName(trimmed)

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !isSubmitting) onCancel()
      }}
    >
      <DialogContent aria-describedby={undefined}>
        <form
          className="flex min-w-0 flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (isValid && !isSubmitting) onConfirm(trimmed)
          }}
        >
          <DialogHeader>
            <DialogTitle>{mode === 'upload' ? '上传启动动画' : '重命名启动动画'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor={id}>文件名</Label>
            <InputGroup>
              <InputGroupInput
                id={id}
                value={name}
                maxLength={STARTUP_MEDIA_NAME_MAX_LENGTH}
                disabled={isSubmitting}
                placeholder={mode === 'upload' ? '留空则使用时间戳' : '请输入文件名'}
                aria-invalid={!isValid}
                aria-describedby={!isValid ? `${id}-error` : undefined}
                onChange={(event) => setName(event.target.value)}
              />
              {extension ? (
                <InputGroupAddon align="inline-end">
                  <InputGroupText>{extension}</InputGroupText>
                </InputGroupAddon>
              ) : null}
            </InputGroup>
            {!isValid ? (
              <p id={`${id}-error`} className="text-destructive text-sm">
                {mode === 'rename' && trimmed.length === 0
                  ? '请输入文件名。'
                  : '仅支持文字、数字、空格、连字符和下划线。'}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              取消
            </Button>
            <Button type="submit" disabled={!isValid || isSubmitting}>
              {mode === 'upload'
                ? isSubmitting
                  ? '上传中…'
                  : '上传'
                : isSubmitting
                  ? '保存中…'
                  : '保存'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
