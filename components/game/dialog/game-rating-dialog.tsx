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
import { updateGameRatingById } from '@/lib/game/game-utils'

type GameRatingDialogProps = {
  gameId: number
  rating: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function GameRatingDialog({
  gameId,
  rating,
  open,
  onOpenChange,
}: GameRatingDialogProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [value, setValue] = useState(String(rating ?? 0))
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }
    setValue(String(rating ?? 0))
  }, [open, rating])

  const handleConfirm = async () => {
    const nextRating = Number(value)
    if (!Number.isInteger(nextRating) || nextRating < 0 || nextRating > 10) {
      toast.error('评分需为 0 到 10 的整数')
      return
    }

    setIsSaving(true)
    try {
      await updateGameRatingById(gameId, nextRating)
      await queryClient.invalidateQueries({
        queryKey: ['game', String(gameId)],
      })
      await queryClient.invalidateQueries({ queryKey: ['game'] })
      router.refresh()
      toast.success('评分已更新')
      onOpenChange(false)
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: string } }
        message?: string
      }
      toast.error(err.response?.data?.error || err.message || '更新评分失败')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>我的评分</DialogTitle>
        </DialogHeader>

        <Input
          type="number"
          min={0}
          max={10}
          step={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="请输入 0-10"
        />

        <DialogFooter>
          <Button
            type="button"
            disabled={isSaving}
            onClick={() => void handleConfirm()}
          >
            {isSaving ? '提交中...' : '确定'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
