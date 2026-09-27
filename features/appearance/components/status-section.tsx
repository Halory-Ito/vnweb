'use client'

import { useStatusSettings } from '@/features/appearance/hooks/use-status-settings'
import { getGamePlayStatusOptions } from '@/features/game/lib/game-status'

export function StatusSection() {
  const { draft, updateDraft, confirmColor } = useStatusSettings()
  const options = getGamePlayStatusOptions()

  return (
    <div className="dark:border-input dark:bg-input/20 space-y-6 rounded-xl border p-6">
      <div>
        <p className="text-base font-semibold">游戏状态</p>
        <p className="text-muted-foreground mt-1 text-sm">
          自定义游戏状态标记的颜色，设置将应用到游戏卡片、列表等位置。
        </p>
      </div>

      <div className="space-y-4">
        {options.map((option) => {
          const key = String(option.value)
          const color = draft[key] ?? '#a1a1aa'

          return (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                  aria-hidden
                />
                <span className="text-sm font-medium">{option.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">{color}</span>
                <input
                  type="color"
                  value={color}
                  onChange={(event) => updateDraft(key, event.target.value)}
                  onBlur={() => void confirmColor(key)}
                  className="border-input h-8 w-8 cursor-pointer rounded border"
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
