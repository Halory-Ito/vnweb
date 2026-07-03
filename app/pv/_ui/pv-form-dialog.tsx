'use client'

import { UploadIcon } from 'lucide-react'
import { useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { api } from '@/lib/request-utils'

import type { GameOption, PvFormState, PvItem } from './types'

type PvFormDialogProps = {
  open: boolean
  editingItem: PvItem | null
  form: PvFormState
  gameOptions: GameOption[]
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onGameIdChange: (value: string) => void
  onNameChange: (value: string) => void
  onUrlChange: (value: string) => void | Promise<void>
  onSubmit: (uploadedUrl?: string) => void
}

export function PvFormDialog({
  open,
  editingItem,
  form,
  gameOptions,
  isSubmitting,
  onOpenChange,
  onGameIdChange,
  onNameChange,
  onUrlChange,
  onSubmit,
}: PvFormDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [useUpload, setUseUpload] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !form.gameId) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('gameId', form.gameId)

      const response = await api.post('/pv/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            )
            setUploadProgress(progress)
          }
        },
      })

      const uploadedUrl = response.data?.data?.url
      if (uploadedUrl) {
        onSubmit(uploadedUrl)
        setSelectedFile(null)
      }
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{editingItem ? '编辑 PV' : '新增 PV'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <div className="text-sm font-medium">游戏</div>
            <Select value={form.gameId} onValueChange={onGameIdChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="请选择游戏" />
              </SelectTrigger>
              <SelectContent>
                {gameOptions.map((game) => (
                  <SelectItem key={game.id} value={game.id}>
                    {game.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">PV 名称</div>
            <Input
              value={form.name}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder="请输入 PV 名称"
            />
          </div>

          {!editingItem && (
            <div className="flex items-center space-x-2">
              <Switch
                id="upload-mode"
                checked={useUpload}
                onCheckedChange={setUseUpload}
              />
              <Label htmlFor="upload-mode">上传本地视频</Label>
            </div>
          )}

          {useUpload && !editingItem ? (
            <div className="space-y-2">
              <div className="text-sm font-medium">视频文件</div>
              <div className="flex items-center gap-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo,video/x-matroska,.mp4,.webm,.ogg,.mov,.avi,.mkv,.m4v"
                  onChange={handleFileSelect}
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
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-sm font-medium">PV 链接</div>
              <Input
                value={form.url}
                onChange={(event) => onUrlChange(event.target.value)}
                placeholder="请输入可访问链接"
              />
            </div>
          )}
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
          <Button
            type="button"
            onClick={() => onSubmit()}
            disabled={
              isSubmitting ||
              isUploading ||
              (useUpload && !editingItem ? !selectedFile : !form.url)
            }
          >
            {isSubmitting ? '提交中...' : editingItem ? '保存修改' : '创建'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
