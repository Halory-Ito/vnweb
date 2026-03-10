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
import { Textarea } from '@/components/ui/textarea'
import { type GameDetail, updateGameInfoById } from '@/lib/game-utils'

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
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>修改基本信息</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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
            <div className="text-sm">发布日期</div>
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
