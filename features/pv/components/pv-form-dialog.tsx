'use client'

import { UploadIcon } from 'lucide-react'
import { useRef, useState } from 'react'

import { usePvUpload } from '../hooks/use-pv-upload'
import { PvBasicFields } from './pv-basic-fields'
import { PvMetadataFields } from './pv-metadata-fields'
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
import { Switch } from '@/components/ui/switch'

import type { GameOption, PvFormState } from '../types'
import type { PvMetadata } from '@/types/pv'

type PvFormDialogProps = {
  open: boolean
  form: PvFormState
  gameOptions: GameOption[]
  categories?: string[]
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onGameIdChange: (value: string) => void
  onNameChange: (value: string) => void
  onUrlChange: (value: string) => void | Promise<void>
  onMetadataChange: (value: PvMetadata) => void
  onSubmit: (uploadedUrl?: string) => void
}

export function PvFormDialog({
  open,
  form,
  gameOptions,
  categories = [],
  isSubmitting,
  onOpenChange,
  onGameIdChange,
  onNameChange,
  onUrlChange,
  onMetadataChange,
  onSubmit,
}: PvFormDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [useUpload, setUseUpload] = useState(false)
  const { isUploading, uploadProgress, selectedFile, setSelectedFile, handleUpload } = usePvUpload(
    form.gameId,
    onSubmit,
  )

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!isUploading) onOpenChange(next)
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>新增 PV</DialogTitle>
          <DialogDescription className="sr-only">
            填写 PV 所属游戏、名称、链接等信息
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <PvBasicFields
            form={form}
            gameOptions={gameOptions}
            onGameIdChange={onGameIdChange}
            onNameChange={onNameChange}
            onUrlChange={useUpload ? undefined : onUrlChange}
          />
          <PvMetadataFields
            value={form.metadata}
            categories={categories}
            onChange={onMetadataChange}
          />

          <div className="flex items-center gap-2">
            <Switch id="upload-mode" checked={useUpload} onCheckedChange={setUseUpload} />
            <Label htmlFor="upload-mode">上传本地视频</Label>
          </div>

          {useUpload ? (
            <div className="space-y-2">
              <div className="text-sm font-medium">视频文件</div>
              <div className="flex items-center gap-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo,video/x-matroska,.mp4,.webm,.ogg,.mov,.avi,.mkv,.m4v"
                  onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting || isUploading}
                  className="flex-1"
                >
                  <UploadIcon className="mr-2 size-4" />
                  {selectedFile ? selectedFile.name : '选择视频文件'}
                </Button>
                {selectedFile && (
                  <Button
                    type="button"
                    onClick={handleUpload}
                    disabled={isSubmitting || isUploading || !form.gameId}
                  >
                    {isUploading ? `上传中 ${uploadProgress}%` : '上传'}
                  </Button>
                )}
              </div>
              {isUploading && (
                <div className="bg-secondary h-2 w-full overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting || isUploading}
          >
            取消
          </Button>
          {!useUpload && (
            <Button type="button" onClick={() => onSubmit()} disabled={isSubmitting || !form.url}>
              {isSubmitting ? '提交中...' : '创建'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
