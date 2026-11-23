import { useSaveStatusPushColor, useStatusPushColors } from '../hooks/use-status-push-colors'
import AppearanceColorInput from './appearance-color-input'
import {
  DEFAULT_GAME_STATUS_PUSH_COLORS,
  GAME_STATUS_PUSH_LABELS,
  GAME_STATUS_PUSH_STATES,
} from '@/lib/settings/game-status-sync'

export function StatusPushColors() {
  const query = useStatusPushColors()
  const save = useSaveStatusPushColor()
  const colors = query.data ?? DEFAULT_GAME_STATUS_PUSH_COLORS

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">平台推送指示点颜色</legend>
      <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {GAME_STATUS_PUSH_STATES.map((state) => (
          <label key={state} className="flex items-center justify-between gap-3 text-sm">
            {GAME_STATUS_PUSH_LABELS[state]}
            <AppearanceColorInput
              key={colors[state]}
              defaultValue={colors[state]}
              disabled={!query.data || save.isPending}
              onBlur={(event) => {
                const input = event.currentTarget
                const color = input.value
                if (color !== colors[state])
                  save.mutate(
                    { state, color },
                    {
                      onError: () => {
                        input.value = colors[state]
                      },
                    },
                  )
              }}
            />
          </label>
        ))}
      </div>
    </fieldset>
  )
}
