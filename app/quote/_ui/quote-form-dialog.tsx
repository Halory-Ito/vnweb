'use client'

import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { getVndbCharactersByGameId } from '@/lib/game/game-utils'

import type { CharacterOption, GameOption, QuoteFormState } from './types'

type QuoteFormDialogProps = {
  open: boolean
  editingId: number | null
  form: QuoteFormState
  gameOptions: GameOption[]
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onFormChange: (form: QuoteFormState) => void
  onSubmit: () => void
}

export function QuoteFormDialog({
  open,
  editingId,
  form,
  gameOptions,
  isSubmitting,
  onOpenChange,
  onFormChange,
  onSubmit,
}: QuoteFormDialogProps) {
  const [characterOptions, setCharacterOptions] = useState<CharacterOption[]>(
    [],
  )
  const [isLoadingCharacters, setIsLoadingCharacters] = useState(false)
  const [noCharactersWarning, setNoCharactersWarning] = useState('')

  useEffect(() => {
    if (!form.gameId) {
      setCharacterOptions([])
      setNoCharactersWarning('')
      return
    }

    let cancelled = false
    const loadCharacters = async () => {
      setIsLoadingCharacters(true)
      setNoCharactersWarning('')
      try {
        const data = await getVndbCharactersByGameId(Number(form.gameId))
        if (cancelled) return
        const options = data.items.map((item) => ({
          id: item.id,
          name: item.name,
        }))
        setCharacterOptions(options)
        if (options.length === 0) {
          setNoCharactersWarning('当前游戏没有关联角色，无法保存角色信息')
        }
      } catch {
        if (!cancelled) {
          setCharacterOptions([])
          setNoCharactersWarning('获取角色列表失败')
        }
      } finally {
        if (!cancelled) {
          setIsLoadingCharacters(false)
        }
      }
    }

    void loadCharacters()
    return () => {
      cancelled = true
    }
  }, [form.gameId])

  const handleGameIdChange = (value: string) => {
    onFormChange({
      ...form,
      gameId: value,
      characterId: '',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{editingId ? '编辑摘录' : '添加摘录'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">
              游戏 <span className="text-destructive">*</span>
            </div>
            <Select value={form.gameId} onValueChange={handleGameIdChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="请选择游戏" />
              </SelectTrigger>
              <SelectContent>
                {gameOptions.map((game) => (
                  <SelectItem key={game.id} value={game.id}>
                    {game.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">
              台词内容 <span className="text-destructive">*</span>
            </div>
            <Textarea
              value={form.content}
              onChange={(e) =>
                onFormChange({ ...form, content: e.target.value })
              }
              placeholder="请输入台词内容"
              className="min-h-24 resize-none"
            />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">出自角色</div>
            {!form.gameId ? (
              <div className="text-muted-foreground text-sm">请先选择游戏</div>
            ) : isLoadingCharacters ? (
              <div className="text-muted-foreground text-sm">加载角色中...</div>
            ) : noCharactersWarning ? (
              <div className="text-destructive text-sm">
                {noCharactersWarning}
              </div>
            ) : (
              <Select
                value={form.characterId || 'none'}
                onValueChange={(value) =>
                  onFormChange({
                    ...form,
                    characterId: value === 'none' ? '' : value,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="请选择角色（可选）" />
                </SelectTrigger>
                <SelectContent className="max-h-50">
                  <SelectItem value="none">不指定角色</SelectItem>
                  {characterOptions.map((character) => (
                    <SelectItem key={character.id} value={character.id}>
                      {character.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">台词背景</div>
            <Textarea
              value={form.context}
              onChange={(e) =>
                onFormChange({ ...form, context: e.target.value })
              }
              placeholder="请输入台词背景信息（可选）"
              className="min-h-20 resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            取消
          </Button>
          <Button type="button" onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? '提交中...' : editingId ? '保存修改' : '创建'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
