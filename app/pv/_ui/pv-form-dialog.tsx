'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import type { GameOption, PvFormState, PvItem } from './types'

type PvFormDialogProps = {
  open: boolean
  editingItem: PvItem | null
  form: PvFormState
  gameOptions: GameOption[]
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onGameIdChange: (value: string) => void
  onNameChange: (value: string) => void
  onUrlChange: (value: string) => void | Promise<void>
  onSubmit: () => void
}

export function PvFormDialog({
  open,
  editingItem,
  form,
  gameOptions,
  isSubmitting,
  onOpenChange,
  onGameIdChange,
  onNameChange,
  onUrlChange,
  onSubmit,
}: PvFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{editingItem ? '编辑 PV' : '新增 PV'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <div className="text-sm font-medium">游戏</div>
            <Select value={form.gameId} onValueChange={onGameIdChange}>
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
            <div className="text-sm font-medium">PV 名称</div>
            <Input
              value={form.name}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder="请输入 PV 名称"
            />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">PV 链接</div>
            <Input
              value={form.url}
              onChange={(event) => onUrlChange(event.target.value)}
              placeholder="请输入可访问链接"
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
            {isSubmitting ? '提交中...' : editingItem ? '保存修改' : '创建'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
