'use client'

import { Gamepad2Icon } from 'lucide-react'
import { useState } from 'react'

import { GameStatusEntryDialog } from './game-status-entry-dialog'
import { GameStatusPlatformButton } from './game-status-platform-button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useStatusPushColors } from '@/features/appearance/hooks/use-status-push-colors'
import { useGameStatusNames } from '@/features/game/hooks/use-game-status-names'
import {
  useGameStatusSync,
  useGameStatusSyncAvailability,
} from '@/features/game/hooks/use-game-status-sync'
import {
  UNKNOWN_GAME_STATUS,
  getGamePlayStatusLabel,
  getGamePlayStatusOptions,
  normalizeGamePlayStatus,
} from '@/features/game/lib/game-status'
import { useEnabledPlatforms } from '@/hooks/use-enabled-platforms'
import { DEFAULT_GAME_STATUS_PUSH_COLORS } from '@/lib/settings/game-status-sync'

import type { GameStatusSyncProvider } from '@/types'

type GamePlayStatusDialogProps = {
  gameId: number
  gameName: string
  currentStatus: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onStatusChange: (status: number) => void
  disabled?: boolean
}

export default function GamePlayStatusDialog({
  gameId,
  gameName,
  currentStatus,
  open,
  onOpenChange,
  onStatusChange,
  disabled,
}: GamePlayStatusDialogProps) {
  const { isPlatformEnabled } = useEnabledPlatforms()
  const { data: pushColors = DEFAULT_GAME_STATUS_PUSH_COLORS } = useStatusPushColors()
  const availability = useGameStatusSyncAvailability(gameId)
  const visiblePlatforms = (availability.data ?? []).filter((platform) =>
    isPlatformEnabled(platform.provider, 'status-sync'),
  )
  const [bindingProvider, setBindingProvider] = useState<GameStatusSyncProvider>()
  const sync = useGameStatusSync(gameId)
  const busy = disabled || sync.isPending
  const { data: statusNames } = useGameStatusNames()
  const selectedStatus = normalizeGamePlayStatus(currentStatus, statusNames)
  const options = [
    ...getGamePlayStatusOptions(statusNames).map(({ value }) => value),
    UNKNOWN_GAME_STATUS,
  ]

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!busy) onOpenChange(nextOpen)
        }}
      >
        <DialogContent aria-describedby={undefined} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gamepad2Icon className="size-5" />
              修改游玩状态
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <RadioGroup
              value={String(selectedStatus)}
              onValueChange={(value) => {
                const nextStatus = Number(value)
                if (!busy && nextStatus !== selectedStatus) onStatusChange(nextStatus)
              }}
              className="grid grid-cols-2 gap-3"
            >
              {options.map((status) => (
                <div key={status} className="relative">
                  <RadioGroupItem
                    value={String(status)}
                    id={`status-${status}`}
                    className="peer sr-only"
                    disabled={busy}
                  />
                  <Label
                    htmlFor={`status-${status}`}
                    className={`flex cursor-pointer items-center justify-center rounded-lg border-2 p-3 transition-all duration-200 ${
                      selectedStatus === status
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50 hover:bg-muted'
                    } ${busy ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    <span className="font-medium">
                      {getGamePlayStatusLabel(status, statusNames)}
                    </span>
                  </Label>
                  {selectedStatus === status && (
                    <div className="bg-primary text-primary-foreground absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full">
                      <svg
                        className="size-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="text-muted-foreground grid gap-2 text-sm" aria-live="polite">
            {availability.isPending && <p>正在读取平台同步配置…</p>}
            {availability.isError && <p>无法读取平台同步配置</p>}
            {visiblePlatforms.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {visiblePlatforms.map((platform) => (
                  <GameStatusPlatformButton
                    key={platform.provider}
                    platform={platform}
                    colors={pushColors}
                    status={selectedStatus}
                    disabled={busy}
                    onBind={() => setBindingProvider(platform.provider)}
                    syncing={sync.isPending && sync.variables.provider === platform.provider}
                    onSync={() =>
                      sync.mutate({ provider: platform.provider, status: selectedStatus })
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      {bindingProvider && (
        <GameStatusEntryDialog
          gameId={gameId}
          gameName={gameName}
          provider={bindingProvider}
          onClose={() => setBindingProvider(undefined)}
        />
      )}
    </>
  )
}
