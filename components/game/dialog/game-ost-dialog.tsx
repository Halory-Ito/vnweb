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

type GameOSTDialogProps = {
  gameId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function GameOSTDialog({
  gameId,
  open,
  onOpenChange,
}: GameOSTDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>修改游戏OST</DialogTitle>
        </DialogHeader>

        <GameMediaManager gameId={gameId} mediaType="ost" />

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
