'use client'

import { PencilIcon, PlayIcon, Trash2Icon } from 'lucide-react'

import { useStartupEditor } from '../hooks/use-startup-editor'
import { StartupMediaNameDialog } from './startup-media-name-dialog'
import { StartupSplashOverlay } from '@/components/layout/startup-splash-overlay'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { MAX_STARTUP_DURATION_MS, MIN_STARTUP_DURATION_MS } from '@/lib/settings/startup-settings'

export function StartupSection() {
  const editor = useStartupEditor()
  const { settings, activeType, activeSlot, fileName, durationSeconds, nameDialog } = editor

  return (
    <>
      <section
        aria-labelledby="startup-settings"
        className="dark:border-input dark:bg-input/20 space-y-6 rounded-xl border p-6"
      >
        <h2 id="startup-settings" className="text-base font-semibold">
          启动动画
        </h2>

        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="startup-animation-enabled">启用启动动画</Label>
          <Switch
            id="startup-animation-enabled"
            checked={settings.enabled}
            onCheckedChange={(checked) => editor.update({ enabled: checked })}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-medium">动画类型</span>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            aria-label="启动动画类型"
            value={activeType}
            onValueChange={(value) => {
              if (value === 'image' || value === 'video') {
                editor.setActiveType(value)
              }
            }}
          >
            <ToggleGroupItem value="image">图片</ToggleGroupItem>
            <ToggleGroupItem value="video">视频</ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-medium">动画素材</span>
          <input
            ref={editor.fileInputRef}
            type="file"
            accept={activeType === 'image' ? 'image/*' : 'video/*'}
            hidden
            onChange={(event) => editor.handleFileChange(event)}
          />
          <div className="ml-auto flex max-w-full min-w-0 flex-wrap items-center justify-end gap-2">
            {fileName ? (
              <span title={fileName} className="text-muted-foreground max-w-44 truncate text-sm">
                {fileName}
              </span>
            ) : null}
            <Button
              type="button"
              variant="outline"
              disabled={editor.isUploading}
              onClick={editor.handlePickFile}
            >
              {editor.isUploading
                ? '上传中...'
                : activeSlot.mediaPath
                  ? '重新选择'
                  : activeType === 'image'
                    ? '选择图片'
                    : '选择视频'}
            </Button>
            {activeSlot.mediaPath ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="重命名启动动画素材"
                  disabled={editor.isRenaming}
                  onClick={editor.openRenameDialog}
                >
                  <PencilIcon className="size-4" />
                </Button>
                <Button type="button" variant="outline" onClick={() => editor.setPreviewOpen(true)}>
                  <PlayIcon className="size-4" />
                  预览
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="清除启动动画素材"
                  onClick={editor.clearMedia}
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </>
            ) : null}
          </div>
        </div>

        {activeSlot.mediaPath ? (
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="startup-match-window-size">按素材尺寸设置启动窗口</Label>
            <Switch
              id="startup-match-window-size"
              checked={activeSlot.matchMediaWindowSize}
              onCheckedChange={(checked) =>
                editor.updateActiveSlot({ matchMediaWindowSize: checked })
              }
            />
          </div>
        ) : null}

        {activeType === 'image' ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">展示时长</span>
              <span className="text-muted-foreground text-sm tabular-nums">{durationSeconds}s</span>
            </div>
            <Slider
              aria-label="展示时长"
              min={MIN_STARTUP_DURATION_MS}
              max={MAX_STARTUP_DURATION_MS}
              step={250}
              value={[settings.image.durationMs]}
              onValueChange={(value) =>
                editor.updateActiveSlotWithDebounce({
                  durationMs: value[0] ?? MIN_STARTUP_DURATION_MS,
                })
              }
            />
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="startup-animation-muted">静音播放</Label>
            <Switch
              id="startup-animation-muted"
              checked={settings.video.muted}
              onCheckedChange={(checked) => editor.updateActiveSlot({ muted: checked })}
            />
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="startup-animation-skippable">允许跳过</Label>
          <Switch
            id="startup-animation-skippable"
            checked={activeSlot.skippable}
            onCheckedChange={(checked) => editor.updateActiveSlot({ skippable: checked })}
          />
        </div>
      </section>

      {nameDialog ? <StartupMediaNameDialog key={nameDialog.key} {...nameDialog.props} /> : null}

      {editor.previewOpen ? (
        <StartupSplashOverlay
          preview
          settingsOverride={settings}
          onClose={() => editor.setPreviewOpen(false)}
        />
      ) : null}
    </>
  )
}
