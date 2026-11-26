'use client'

import { Loader2 } from 'lucide-react'
import { useId } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MAX_APP_PORT, MIN_APP_PORT } from '@/lib/settings/app-settings'

type AppPortSectionProps = {
  portInput: string
  savedPort: number
  runtimePort: number | null
  canRestartServer: boolean
  hasPortChanges: boolean
  hasCustomPort: boolean
  isBusy: boolean
  isSavingPort: boolean
  isRestarting: boolean
  onPortChange: (value: string) => void
  onSavePort: () => void
  onResetPort: () => void
  onRestartServer: () => void
}

export function AppPortSection({
  portInput,
  savedPort,
  runtimePort,
  canRestartServer,
  hasPortChanges,
  hasCustomPort,
  isBusy,
  isSavingPort,
  isRestarting,
  onPortChange,
  onSavePort,
  onResetPort,
  onRestartServer,
}: AppPortSectionProps) {
  const portInputId = useId()
  const needsRestart = canRestartServer && runtimePort !== null && savedPort !== runtimePort

  return (
    <section
      aria-labelledby="app-port-settings-title"
      className="dark:border-input dark:bg-input/20 flex flex-col gap-4 rounded-xl border p-6"
    >
      <h2 id="app-port-settings-title" className="text-base font-semibold">
        服务端口
      </h2>

      {runtimePort !== null ? (
        <div className="flex min-h-8 flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-medium">当前运行端口</span>
          <Badge variant="outline">{runtimePort}</Badge>
        </div>
      ) : null}

      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          if (hasPortChanges && !isBusy) onSavePort()
        }}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <Label htmlFor={portInputId}>监听端口号</Label>
          <Input
            id={portInputId}
            type="number"
            min={MIN_APP_PORT}
            max={MAX_APP_PORT}
            step={1}
            value={portInput}
            disabled={isBusy}
            onChange={(event) => onPortChange(event.target.value)}
            className="w-full sm:max-w-md"
          />
        </div>
        <div className="flex flex-wrap justify-end gap-2 pt-1">
          {needsRestart ? (
            <Button type="button" variant="outline" disabled={isBusy} onClick={onRestartServer}>
              {isRestarting ? <Loader2 className="animate-spin" /> : '重启服务'}
            </Button>
          ) : null}
          {hasCustomPort ? (
            <Button type="button" variant="outline" disabled={isBusy} onClick={onResetPort}>
              恢复默认
            </Button>
          ) : null}
          <Button type="submit" variant="outline" disabled={isBusy || !hasPortChanges}>
            {isSavingPort ? <Loader2 className="animate-spin" /> : '保存端口'}
          </Button>
        </div>
      </form>
    </section>
  )
}
