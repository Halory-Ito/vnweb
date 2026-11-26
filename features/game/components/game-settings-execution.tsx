import { FolderOpenIcon } from 'lucide-react'
import { useId } from 'react'

import { useGameExecutionSettings } from '../hooks/use-game-execution-settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { GAME_TRACKING_MODE_OPTIONS } from '@/lib/game-tracking'

import type { GameDetail, GameTrackingMode } from '@/types'

const pathFields = [
  { field: 'exePath', label: '可执行路径', pickerLabel: '选择可执行文件' },
  { field: 'saveDir', label: '存档路径', pickerLabel: '选择存档目录' },
] as const

export function GameSettingsExecution({ game }: { game: GameDetail }) {
  const id = useId()
  const { form, defaultTrackingTarget, setField, setTrackingMode, picker, save } =
    useGameExecutionSettings(game)
  const disabled = save.isPending || picker.isPending

  const trackingPlaceholder =
    defaultTrackingTarget ||
    (form.trackingMode === 'process'
      ? '例如：Game.exe，多进程名可用逗号分隔'
      : '留空则默认按可执行路径推导')

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (!disabled) save.mutate(form)
      }}
    >
      {pathFields.map(({ field, label, pickerLabel }) => (
        <div key={field} className="flex flex-col gap-2">
          <label htmlFor={`${id}-${field}`} className="text-sm font-medium">
            {label}
          </label>
          <div className="flex gap-2">
            <Input
              id={`${id}-${field}`}
              className="min-w-0"
              value={form[field]}
              disabled={disabled}
              onChange={(event) => setField(field, event.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => picker.mutate(field)}
              aria-label={pickerLabel}
              disabled={disabled}
            >
              <FolderOpenIcon className="size-4" />
            </Button>
          </div>
        </div>
      ))}

      <div className="flex flex-col gap-2">
        <label htmlFor={`${id}-tracking-mode`} className="text-sm font-medium">
          追踪模式
        </label>
        <Select
          value={form.trackingMode}
          disabled={disabled}
          onValueChange={(value) => setTrackingMode(value as GameTrackingMode)}
        >
          <SelectTrigger id={`${id}-tracking-mode`} className="w-full sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GAME_TRACKING_MODE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={`${id}-tracking-target`} className="text-sm font-medium">
          追踪目标
        </label>
        <div className="flex gap-2">
          <Input
            id={`${id}-tracking-target`}
            className="min-w-0"
            value={form.trackingTarget}
            placeholder={trackingPlaceholder}
            disabled={disabled}
            onChange={(event) => setField('trackingTarget', event.target.value)}
          />
          {form.trackingMode !== 'process' ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() =>
                picker.mutate(
                  form.trackingMode === 'directory' ? 'trackingDirectory' : 'trackingFile',
                )
              }
              aria-label={form.trackingMode === 'directory' ? '选择追踪目录' : '选择追踪文件'}
              disabled={disabled}
            >
              <FolderOpenIcon className="size-4" />
            </Button>
          ) : null}
        </div>
      </div>

      <Button className="self-start" type="submit" disabled={disabled}>
        {save.isPending ? '保存中...' : '保存'}
      </Button>
    </form>
  )
}
