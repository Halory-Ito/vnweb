import { useState } from 'react'

import { useGameBasicInfoForm } from '../hooks/use-game-basic-info-form'
import GameUpdateDataDialog from './dialog/game-update-data-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

import type { GameDetail } from '@/types'

export function GameBasicInfoForm({ game }: { game: GameDetail }) {
  const [updateOpen, setUpdateOpen] = useState(false)
  const { formValues, setField, isSaving, handleSave } = useGameBasicInfoForm(game)

  return (
    <form
      className="flex min-h-0 flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (!isSaving) handleSave()
      }}
    >
      <fieldset disabled={isSaving} className="grid min-h-0 gap-4 sm:grid-cols-2">
        <label className="flex min-w-0 flex-col gap-2 text-sm">
          <span>游戏名称</span>
          <Input value={formValues.name} onChange={(e) => setField('name', e.target.value)} />
        </label>
        <label className="flex min-w-0 flex-col gap-2 text-sm">
          <span>中文名称</span>
          <Input value={formValues.nameCn} onChange={(e) => setField('nameCn', e.target.value)} />
        </label>
        <label className="flex min-w-0 flex-col gap-2 text-sm">
          <span>发售日期</span>
          <Input value={formValues.date} onChange={(e) => setField('date', e.target.value)} />
        </label>
        <label className="flex min-w-0 flex-col gap-2 text-sm">
          <span>外部数据源id</span>
          <Input
            value={formValues.externalSourceIds}
            onChange={(e) => setField('externalSourceIds', e.target.value)}
            placeholder="bangumi:935;steam:205790"
          />
        </label>
        <label className="flex min-w-0 flex-col gap-2 text-sm">
          <span>标签（逗号分隔）</span>
          <Input value={formValues.tags} onChange={(e) => setField('tags', e.target.value)} />
        </label>
        <label className="flex min-w-0 flex-col gap-2 text-sm">
          <span>开发商</span>
          <Input
            value={formValues.developer}
            onChange={(e) => setField('developer', e.target.value)}
          />
        </label>
        <label className="flex min-w-0 flex-col gap-2 text-sm">
          <span>发行商</span>
          <Input
            value={formValues.publisher}
            onChange={(e) => setField('publisher', e.target.value)}
          />
        </label>
        <label className="flex min-w-0 flex-col gap-2 text-sm">
          <span>游戏类型</span>
          <Input
            value={formValues.gameType}
            onChange={(e) => setField('gameType', e.target.value)}
          />
        </label>
        <label className="flex min-w-0 flex-col gap-2 text-sm">
          <span>游戏引擎</span>
          <Input
            value={formValues.gameEngine}
            onChange={(e) => setField('gameEngine', e.target.value)}
          />
        </label>
        <label className="flex min-w-0 flex-col gap-2 text-sm">
          <span>平台（逗号分隔）</span>
          <Input
            value={formValues.platforms}
            onChange={(e) => setField('platforms', e.target.value)}
          />
        </label>
        <label className="flex min-w-0 flex-col gap-2 text-sm">
          <span>音乐</span>
          <Input value={formValues.music} onChange={(e) => setField('music', e.target.value)} />
        </label>
        <label className="flex min-w-0 flex-col gap-2 text-sm">
          <span>剧本</span>
          <Input value={formValues.script} onChange={(e) => setField('script', e.target.value)} />
        </label>
        <label className="flex min-w-0 flex-col gap-2 text-sm">
          <span>美术</span>
          <Input value={formValues.graphic} onChange={(e) => setField('graphic', e.target.value)} />
        </label>
        <label className="flex min-w-0 flex-col gap-2 text-sm">
          <span>原画</span>
          <Input
            value={formValues.originalPainter}
            onChange={(e) => setField('originalPainter', e.target.value)}
          />
        </label>
        <label className="flex min-w-0 flex-col gap-2 text-sm">
          <span>动画制作</span>
          <Input
            value={formValues.animationProduction}
            onChange={(e) => setField('animationProduction', e.target.value)}
          />
        </label>
        <label className="flex min-w-0 flex-col gap-2 text-sm">
          <span>程序</span>
          <Input
            value={formValues.programmer}
            onChange={(e) => setField('programmer', e.target.value)}
          />
        </label>
        <div className="flex items-center justify-between rounded-md">
          <div className="space-y-0.5">
            <div className="text-sm">NSFW</div>
          </div>
          <Switch
            checked={formValues.nsfw}
            onCheckedChange={(checked) => setField('nsfw', checked)}
            aria-label="切换 NSFW 状态"
          />
        </div>
        <label className="flex min-w-0 flex-col gap-2 text-sm sm:col-span-2">
          <span>简介</span>
          <Textarea
            value={formValues.summary}
            onChange={(e) => setField('summary', e.target.value)}
          />
        </label>
      </fieldset>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? '保存中...' : '保存'}
        </Button>
        <GameUpdateDataDialog
          gameId={game.id}
          initialKeyword={game.nameCn || game.name}
          open={updateOpen}
          onOpenChange={setUpdateOpen}
          triggerDisabled={isSaving}
        />
      </div>
    </form>
  )
}
