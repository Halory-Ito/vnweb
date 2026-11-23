import { useStatusMappings } from '../hooks/use-status-mappings'
import { VndbPermissionsButton } from './vndb-permissions-button'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useGameStatusNames } from '@/features/game/hooks/use-game-status-names'
import { getGamePlayStatusOptions } from '@/features/game/lib/game-status'
import { GAME_STATUS_SYNC_LABELS, GAME_STATUS_SYNC_OPTIONS } from '@/lib/settings/game-status-sync'

import type { GameStatusSyncProvider } from '@/types'

export function PlatformStatusMappings({ provider }: { provider: GameStatusSyncProvider }) {
  const names = useGameStatusNames()
  const { query, save } = useStatusMappings()
  const options = names.data ? getGamePlayStatusOptions(names.data) : []

  return (
    <section
      id={`status-mappings-${provider}`}
      className="scroll-mt-6 space-y-3"
      aria-labelledby={`status-mappings-title-${provider}`}
    >
      <div className="flex items-center gap-2">
        <h3 id={`status-mappings-title-${provider}`} className="text-sm font-medium">
          游玩状态映射
        </h3>
        {provider === 'vndb' && <VndbPermissionsButton />}
      </div>
      {names.isError || query.isError ? (
        <Button
          variant="outline"
          type="button"
          onClick={() => void Promise.all([names.refetch(), query.refetch()])}
        >
          重新加载映射
        </Button>
      ) : names.isPending || query.isPending ? (
        <p role="status" className="text-muted-foreground text-sm">
          正在加载映射…
        </p>
      ) : (
        <div className="grid gap-x-6 gap-y-2 lg:grid-cols-2">
          {options.map(({ value, label }) => (
            <div key={value} className="flex min-w-0 flex-wrap items-center justify-between gap-2">
              <label
                htmlFor={`status-mapping-${provider}-${value}`}
                className="min-w-0 text-sm wrap-break-word"
              >
                {label}
              </label>
              <Select
                value={String(query.data?.[value]?.[provider] ?? 0)}
                disabled={save.isPending}
                onValueChange={(target) => save.mutate([value, provider, Number(target) || null])}
              >
                <SelectTrigger
                  id={`status-mapping-${provider}-${value}`}
                  aria-label={`${label} ${GAME_STATUS_SYNC_LABELS[provider]} 映射`}
                  className="w-full sm:w-36"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">不同步</SelectItem>
                  {GAME_STATUS_SYNC_OPTIONS[provider].map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
