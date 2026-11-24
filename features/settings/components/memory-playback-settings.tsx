'use client'

import { useId } from 'react'

import { useMemoryPlaybackSettings } from '../hooks/use-memory-playback-settings'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  MEMORY_PLAYBACK_MODE_OPTIONS,
  type MemoryPlaybackMode,
} from '@/lib/settings/memory-metadata-settings'

export function MemoryPlaybackSettings() {
  const { playback, isLoading, isSaving, updatePlayback } = useMemoryPlaybackSettings()
  const baseId = useId()

  const autoPlayId = `${baseId}-auto-play`
  const playModeId = `${baseId}-play-mode`
  const interruptId = `${baseId}-interrupt`
  const stopOnLeaveId = `${baseId}-stop-on-leave`

  return (
    <div className="dark:border-input dark:bg-input/20 space-y-6 rounded-xl border p-6">
      <p className="text-base font-semibold">回忆配乐播放</p>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="border-border/60 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
            <Label htmlFor={autoPlayId} className="font-normal">
              进入详情页时自动播放
            </Label>
            <Switch
              id={autoPlayId}
              checked={playback.autoPlayOnEnter}
              disabled={isSaving}
              onCheckedChange={(autoPlayOnEnter) => void updatePlayback({ autoPlayOnEnter })}
            />
          </div>

          <div className="border-border/60 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
            <Label htmlFor={playModeId} className="font-normal">
              自动播放模式
            </Label>
            <Select
              value={playback.playMode}
              disabled={isSaving || !playback.autoPlayOnEnter}
              onValueChange={(playMode) =>
                void updatePlayback({ playMode: playMode as MemoryPlaybackMode })
              }
            >
              <SelectTrigger id={playModeId} className="w-48" aria-label="自动播放模式">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEMORY_PLAYBACK_MODE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border-border/60 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
            <Label htmlFor={interruptId} className="font-normal">
              切换覆盖正在播放的音乐
            </Label>
            <Switch
              id={interruptId}
              checked={playback.interruptCurrentPlayback}
              disabled={isSaving || !playback.autoPlayOnEnter}
              onCheckedChange={(interruptCurrentPlayback) =>
                void updatePlayback({ interruptCurrentPlayback })
              }
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Label htmlFor={stopOnLeaveId} className="font-normal">
              离开详情页时自动停止播放
            </Label>
            <Switch
              id={stopOnLeaveId}
              checked={playback.stopOnLeave}
              disabled={isSaving}
              onCheckedChange={(stopOnLeave) => void updatePlayback({ stopOnLeave })}
            />
          </div>
        </div>
      )}
    </div>
  )
}
