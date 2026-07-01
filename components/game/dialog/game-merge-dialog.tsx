'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api } from '@/lib/request-utils'

type GameMergeDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  gameIds: string[]
  gameNames: Record<string, string>
  onMergeComplete: () => void
}

export default function GameMergeDialog({
  open,
  onOpenChange,
  gameIds,
  gameNames,
  onMergeComplete,
}: GameMergeDialogProps) {
  const [targetId, setTargetId] = useState<string>('')
  const [isMerging, setIsMerging] = useState(false)

  const handleMerge = async () => {
    if (!targetId) {
      toast.error('请选择目标游戏')
      return
    }

    const sourceIds = gameIds.filter((id) => id !== targetId)
    if (sourceIds.length === 0) {
      toast.error('至少需要选择两个游戏才能合并')
      return
    }

    setIsMerging(true)
    try {
      await api.post('/game/merge', {
        sourceIds,
        targetId,
      })
      toast.success(`已成功合并 ${sourceIds.length} 个游戏`)
      onMergeComplete()
      onOpenChange(false)
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: string } }
        message?: string
      }
      toast.error(err.response?.data?.error || err.message || '合并失败')
    } finally {
      setIsMerging(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>合并游戏</DialogTitle>
          <DialogDescription>
            将选中的游戏合并为一个。所有关联数据（存档、角色、PV、OST等）将被迁移到目标游戏，源游戏将被删除。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>已选择的游戏</Label>
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border p-2">
              {gameIds.map((id) => (
                <div
                  key={id}
                  className="text-muted-foreground rounded px-2 py-1 text-sm"
                >
                  {gameNames[id] || `游戏 #${id}`}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>目标游戏（保留此游戏）</Label>
            <Select value={targetId} onValueChange={setTargetId}>
              <SelectTrigger>
                <SelectValue placeholder="选择要保留的游戏" />
              </SelectTrigger>
              <SelectContent>
                {gameIds.map((id) => (
                  <SelectItem key={id} value={id}>
                    {gameNames[id] || `游戏 #${id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            disabled={isMerging || !targetId}
            onClick={() => void handleMerge()}
          >
            {isMerging ? '合并中...' : '确认合并'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
