'use client'

import GameMediaManager from '@/components/game/info/game-media-manager'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type GamePVDialogProps = {
  gameId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function GamePVDialog({
  gameId,
  open,
  onOpenChange,
}: GamePVDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>修改游戏PV</DialogTitle>
        </DialogHeader>

        <GameMediaManager gameId={gameId} mediaType="pv" />

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
