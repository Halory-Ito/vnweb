'use client'

import { useAtom } from 'jotai'

import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { gameCardRadiusAtom, gameCardTitleHiddenAtom } from '@/lib/settings/game-card-appearance'
import { MAX_GAME_CARD_RADIUS } from '@/lib/settings/layout-settings'

export function GameCardSection() {
  const [titleHidden, setTitleHidden] = useAtom(gameCardTitleHiddenAtom)
  const [radius, setRadius] = useAtom(gameCardRadiusAtom)

  return (
    <section
      aria-labelledby="game-card-settings"
      className="dark:border-input dark:bg-input/20 space-y-4 rounded-xl border p-6"
    >
      <h2 id="game-card-settings" className="text-base font-semibold">
        游戏卡片
      </h2>
      <div className="flex min-h-8 items-center justify-between gap-3">
        <Label htmlFor="hide-game-card-title">隐藏游戏名称</Label>
        <Switch id="hide-game-card-title" checked={titleHidden} onCheckedChange={setTitleHidden} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm font-medium">圆角</span>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
          <Slider
            className="max-w-48"
            thumbLabel="游戏卡片圆角（像素）"
            min={0}
            max={MAX_GAME_CARD_RADIUS}
            step={1}
            value={[radius]}
            onValueChange={([value]) => setRadius(value)}
          />
          <span className="text-muted-foreground w-12 shrink-0 text-right text-sm tabular-nums">
            {radius} px
          </span>
        </div>
      </div>
    </section>
  )
}
