import { LoaderCircle } from 'lucide-react'
import Link from 'next/link'
import { Popover as PopoverPrimitive } from 'radix-ui'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { GAME_STATUS_PUSH_LABELS, GAME_STATUS_SYNC_LABELS } from '@/lib/settings/game-status-sync'

import type { GameStatusPushColors, GameStatusPushState, GameStatusSyncAvailability } from '@/types'

export function GameStatusPlatformButton({
  platform,
  colors,
  status,
  disabled,
  onBind,
  onSync,
  syncing,
}: {
  platform: GameStatusSyncAvailability
  colors: GameStatusPushColors
  status: number
  disabled?: boolean
  onBind: () => void
  onSync: () => void
  syncing: boolean
}) {
  const { provider, linked, accountBound, mappedStatuses, pushedStatuses, pushedAt } = platform
  const settingsHref = `/settings/sync#status-mappings-${provider}`
  const mapped = mappedStatuses.includes(status)
  const ready = mapped && linked && accountBound
  const state: GameStatusPushState = !ready
    ? 'unavailable'
    : pushedStatuses.includes(status)
      ? 'pushed'
      : pushedAt
        ? 'pending'
        : 'unsynced'
  const name = GAME_STATUS_SYNC_LABELS[provider]
  const label = [
    name,
    GAME_STATUS_PUSH_LABELS[state],
    !accountBound && '未绑定账号',
    mapped ? '已配置同步' : '未配置同步',
    linked ? '已关联条目' : '未关联条目',
  ]
    .filter(Boolean)
    .join('，')
  const content = (
    <>
      <span
        aria-hidden="true"
        className="size-2 shrink-0 rounded-full"
        style={{ backgroundColor: colors[state] }}
      />
      {name}
    </>
  )

  if (ready || disabled) {
    return (
      <Button
        type="button"
        variant="outline"
        aria-label={syncing ? `${name} 同步中` : label}
        title={label}
        aria-busy={syncing}
        disabled={disabled || !ready}
        onClick={onSync}
      >
        {syncing ? (
          <>
            <LoaderCircle className="motion-safe:animate-spin" aria-hidden="true" />
            同步中…
          </>
        ) : (
          content
        )}
      </Button>
    )
  }
  if (linked) {
    return (
      <Button variant="outline" asChild>
        <Link
          href={mapped ? `/settings/sync#platform-section-${provider}` : settingsHref}
          aria-label={label}
          title={label}
        >
          {content}
        </Link>
      </Button>
    )
  }
  if (mapped) {
    return (
      <Button type="button" variant="outline" aria-label={label} title={label} onClick={onBind}>
        {content}
      </Button>
    )
  }
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" aria-label={label} title={label}>
          {content}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="flex w-auto flex-col gap-2 p-2">
        <Button variant="outline" asChild>
          <Link href={settingsHref}>配置状态同步</Link>
        </Button>
        <PopoverPrimitive.Close asChild>
          <Button type="button" variant="outline" onClick={onBind}>
            搜索并关联条目
          </Button>
        </PopoverPrimitive.Close>
      </PopoverContent>
    </Popover>
  )
}
