'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import GameMediaManager from '@/features/game/components/info/game-media-manager'

type GamePVDialogProps = {
  gameId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function GamePVDialog({ gameId, open, onOpenChange }: GamePVDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>修改游戏PV</DialogTitle>
          <DialogDescription className="sr-only">管理该游戏关联的 PV 视频</DialogDescription>
        </DialogHeader>

        <GameMediaManager gameId={gameId} mediaType="pv" />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
