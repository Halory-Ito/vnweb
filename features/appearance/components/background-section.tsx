'use client'

import { useState } from 'react'

import { useBackgroundEditor } from '../hooks/use-background-editor'
import { BackgroundUploadDialog } from './background-upload-dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { BACKGROUND_TRANSITION_STYLE_OPTIONS } from '@/lib/settings/background-settings'

export function BackgroundSection() {
  const editor = useBackgroundEditor()
  const [device, setDevice] = useState<'pc' | 'mobile'>('pc')
  const { settings } = editor
  const devices = [
    { id: 'pc', label: 'PC端', path: settings.customBackgroundImagePc, ref: editor.fileInputRefPc },
    {
      id: 'mobile',
      label: '移动端',
      path: settings.customBackgroundImageMobile,
      ref: editor.fileInputRefMobile,
    },
  ] as const

  return (
    <div className="dark:border-input dark:bg-input/20 space-y-6 rounded-xl border p-6">
      <p className="text-base font-semibold">背景</p>

      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="custom-background">启用自定义背景</Label>
        <Switch
          id="custom-background"
          checked={settings.customBackgroundEnabled}
          onCheckedChange={(checked) => editor.update({ customBackgroundEnabled: checked })}
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-medium">自定义背景图片</span>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            aria-label="背景图片设备"
            value={device}
            onValueChange={(value) => {
              if (value === 'pc' || value === 'mobile') setDevice(value)
            }}
          >
            {devices.map(({ id, label }) => (
              <ToggleGroupItem key={id} value={id}>
                {label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        {devices.map(({ id, label, path, ref }) => {
          const filename = path.split('?')[0].split('/').pop()
          return (
            <div key={id} hidden={device !== id}>
              <input
                ref={ref}
                type="file"
                accept="image/*"
                hidden
                onChange={(event) => editor.handleFileChange(event, id)}
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm">{label}背景</p>
                <div className="ml-auto flex max-w-full min-w-0 items-center justify-end gap-2">
                  {filename ? (
                    <span
                      title={filename}
                      className="text-muted-foreground min-w-0 truncate text-sm"
                    >
                      {filename}
                    </span>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0"
                    disabled={editor.isUploading}
                    onClick={() => editor.handlePickFile(id)}
                  >
                    {editor.isUploading && editor.pendingUpload?.device === id
                      ? '上传中...'
                      : path
                        ? '重新选择'
                        : '选择图片'}
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {editor.pendingUpload ? (
        <BackgroundUploadDialog
          {...editor.pendingUpload}
          isUploading={editor.isUploading}
          onCancel={editor.cancelUpload}
          onConfirm={(name) => void editor.confirmUpload(name)}
        />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Label htmlFor="background-transition-style">切换动画样式</Label>
        <Select
          value={settings.transitionStyle}
          onValueChange={(value) =>
            editor.update({ transitionStyle: value as typeof settings.transitionStyle })
          }
        >
          <SelectTrigger id="background-transition-style">
            <SelectValue placeholder="选择动画样式" />
          </SelectTrigger>
          <SelectContent>
            {BACKGROUND_TRANSITION_STYLE_OPTIONS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">过渡时长</span>
          <span className="text-muted-foreground text-sm">{settings.transitionDurationMs}ms</span>
        </div>
        <Slider
          aria-label="过渡时长"
          min={0}
          max={3000}
          step={50}
          value={[settings.transitionDurationMs]}
          onValueChange={(value) =>
            editor.updateWithDebounce({ transitionDurationMs: value[0] ?? 0 })
          }
        />
      </div>
    </div>
  )
}
