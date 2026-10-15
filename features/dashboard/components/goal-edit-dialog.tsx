'use client'

import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import type { GoalSettings } from '@/types'

type GoalEditDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  value: GoalSettings
  isSaving: boolean
  onSubmit: (value: GoalSettings) => void
}

export default function GoalEditDialog({
  open,
  onOpenChange,
  value,
  isSaving,
  onSubmit,
}: GoalEditDialogProps) {
  const [dailyMinutes, setDailyMinutes] = useState(String(value.dailyPlayMinutes))
  const [yearlyGames, setYearlyGames] = useState(String(value.yearlyCompletedGames))
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setDailyMinutes(String(value.dailyPlayMinutes))
      setYearlyGames(String(value.yearlyCompletedGames))
      setError('')
    }
  }, [open, value.dailyPlayMinutes, value.yearlyCompletedGames])

  const handleSubmit = () => {
    const daily = Number(dailyMinutes)
    const yearly = Number(yearlyGames)

    if (!Number.isFinite(daily) || daily <= 0) {
      setError('每日游玩时长需为大于 0 的整数（分钟）')
      return
    }
    if (!Number.isInteger(yearly) || yearly <= 0) {
      setError('今年完成游戏数需为大于 0 的整数')
      return
    }

    onSubmit({ dailyPlayMinutes: Math.round(daily), yearlyCompletedGames: yearly })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>编辑目标</DialogTitle>
          <DialogDescription className="sr-only">
            设置每日游玩时长与今年完成游戏数目标
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="goal-daily-minutes">每日游玩时长（分钟）</Label>
            <Input
              id="goal-daily-minutes"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={dailyMinutes}
              onChange={(event) => setDailyMinutes(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal-yearly-games">今年完成游戏数（个）</Label>
            <Input
              id="goal-yearly-games"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={yearlyGames}
              onChange={(event) => setYearlyGames(event.target.value)}
            />
          </div>
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button type="button" disabled={isSaving} onClick={handleSubmit}>
            {isSaving ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
