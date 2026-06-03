'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { type GameDetail, updateGameInfoById } from '@/lib/game/game-utils'

type GameBasicInfoDialogProps = {
  game: GameDetail
  open: boolean
  onOpenChange: (open: boolean) => void
}

type FormValues = {
  name: string
  nameCn: string
  date: string
  cover: string
  externalSourceIds: string
  summary: string
  tags: string
  developer: string
  publisher: string
  gameType: string
  gameEngine: string
  platforms: string
  music: string
  script: string
  graphic: string
  originalPainter: string
  animationProduction: string
  programmer: string
  nsfw: boolean
}

export default function GameBasicInfoDialog({
  game,
  open,
  onOpenChange,
}: GameBasicInfoDialogProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isSaving, setIsSaving] = useState(false)
  const [formValues, setFormValues] = useState<FormValues>({
    name: game.name || '',
    nameCn: game.nameCn || '',
    date: game.date || '',
    cover: game.cover || '',
    externalSourceIds: game.externalSourceIds || '',
    summary: game.summary || '',
    tags: (game.tags || []).join(', '),
    developer: game.developer || '',
    publisher: game.publisher || '',
    gameType: game.gameType || '',
    gameEngine: game.gameEngine || '',
    platforms: (game.platforms || []).join(', '),
    music: game.music || '',
    script: game.script || '',
    graphic: game.graphic || '',
    originalPainter: game.originalPainter || '',
    animationProduction: game.animationProduction || '',
    programmer: game.programmer || '',
    nsfw: Boolean(game.nsfw),
  })

  useEffect(() => {
    if (!open) {
      return
    }
    setFormValues({
      name: game.name || '',
      nameCn: game.nameCn || '',
      date: game.date || '',
      cover: game.cover || '',
      externalSourceIds: game.externalSourceIds || '',
      summary: game.summary || '',
      tags: (game.tags || []).join(', '),
      developer: game.developer || '',
      publisher: game.publisher || '',
      gameType: game.gameType || '',
      gameEngine: game.gameEngine || '',
      platforms: (game.platforms || []).join(', '),
      music: game.music || '',
      script: game.script || '',
      graphic: game.graphic || '',
      originalPainter: game.originalPainter || '',
      animationProduction: game.animationProduction || '',
      programmer: game.programmer || '',
      nsfw: Boolean(game.nsfw),
    })
  }, [
    open,
    game.name,
    game.nameCn,
    game.date,
    game.cover,
    game.externalSourceIds,
    game.summary,
    game.tags,
    game.developer,
    game.publisher,
    game.gameType,
    game.gameEngine,
    game.platforms,
    game.music,
    game.script,
    game.graphic,
    game.originalPainter,
    game.animationProduction,
    game.programmer,
    game.nsfw,
  ])

  const setField = (key: keyof FormValues, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateGameInfoById(game.id, {
        name: formValues.name,
        nameCn: formValues.nameCn,
        date: formValues.date,
        cover: formValues.cover,
        externalSourceIds: formValues.externalSourceIds,
        summary: formValues.summary,
        tags: formValues.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        developer: formValues.developer,
        publisher: formValues.publisher,
        gameType: formValues.gameType,
        gameEngine: formValues.gameEngine,
        platforms: formValues.platforms
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        music: formValues.music,
        script: formValues.script,
        graphic: formValues.graphic,
        originalPainter: formValues.originalPainter,
        animationProduction: formValues.animationProduction,
        programmer: formValues.programmer,
        nsfw: formValues.nsfw,
      })

      await queryClient.invalidateQueries({
        queryKey: ['game', String(game.id)],
      })
      await queryClient.invalidateQueries({ queryKey: ['game'] })
      await queryClient.invalidateQueries({ queryKey: ['game-cards'] })
      await queryClient.invalidateQueries({ queryKey: ['game-sidebar'] })
      router.refresh()
      toast.success('基本信息已更新')
      onOpenChange(false)
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: string } }
        message?: string
      }
      toast.error(err.response?.data?.error || err.message || '更新失败')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>修改基本信息</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          <div className="space-y-2">
            <div className="text-sm">游戏名称</div>
            <Input
              value={formValues.name}
              onChange={(e) => setField('name', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <div className="text-sm">中文名称</div>
            <Input
              value={formValues.nameCn}
              onChange={(e) => setField('nameCn', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <div className="text-sm">发售日期</div>
            <Input
              value={formValues.date}
              onChange={(e) => setField('date', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <div className="text-sm">封面链接</div>
            <Input
              value={formValues.cover}
              onChange={(e) => setField('cover', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <div className="text-sm">外部数据源id</div>
            <Input
              value={formValues.externalSourceIds}
              onChange={(e) => setField('externalSourceIds', e.target.value)}
              placeholder="bangumi:935;steam:205790"
            />
            <div className="text-muted-foreground text-xs">
              格式：provider1:id1;provider2:id2
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm">标签（逗号分隔）</div>
            <Input
              value={formValues.tags}
              onChange={(e) => setField('tags', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <div className="text-sm">开发商</div>
            <Input
              value={formValues.developer}
              onChange={(e) => setField('developer', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <div className="text-sm">发行商</div>
            <Input
              value={formValues.publisher}
              onChange={(e) => setField('publisher', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <div className="text-sm">游戏类型</div>
            <Input
              value={formValues.gameType}
              onChange={(e) => setField('gameType', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <div className="text-sm">游戏引擎</div>
            <Input
              value={formValues.gameEngine}
              onChange={(e) => setField('gameEngine', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <div className="text-sm">平台（逗号分隔）</div>
            <Input
              value={formValues.platforms}
              onChange={(e) => setField('platforms', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <div className="text-sm">音乐</div>
            <Input
              value={formValues.music}
              onChange={(e) => setField('music', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <div className="text-sm">剧本</div>
            <Input
              value={formValues.script}
              onChange={(e) => setField('script', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <div className="text-sm">美术</div>
            <Input
              value={formValues.graphic}
              onChange={(e) => setField('graphic', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <div className="text-sm">原画</div>
            <Input
              value={formValues.originalPainter}
              onChange={(e) => setField('originalPainter', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <div className="text-sm">动画制作</div>
            <Input
              value={formValues.animationProduction}
              onChange={(e) => setField('animationProduction', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <div className="text-sm">程序</div>
            <Input
              value={formValues.programmer}
              onChange={(e) => setField('programmer', e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <div className="space-y-0.5">
              <div className="text-sm">NSFW</div>
            </div>
            <Switch
              checked={formValues.nsfw}
              onCheckedChange={(checked) =>
                setFormValues((prev) => ({ ...prev, nsfw: checked }))
              }
              aria-label="切换 NSFW 状态"
            />
          </div>
          <div className="space-y-2">
            <div className="text-sm">简介</div>
            <Textarea
              value={formValues.summary}
              onChange={(e) => setField('summary', e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button
            type="button"
            disabled={isSaving}
            onClick={() => void handleSave()}
          >
            {isSaving ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
