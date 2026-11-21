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

type GameExePathDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  value: string
  onValueChange: (value: string) => void
  isLaunching: boolean
  onConfirm: () => void
}

export default function GameExePathDialog({
  open,
  onOpenChange,
  value,
  onValueChange,
  isLaunching,
  onConfirm,
}: GameExePathDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>填写游戏可执行文件路径</DialogTitle>
          <DialogDescription>当前游戏缺少可执行文件路径，请补充后再启动。</DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            onConfirm()
          }}
        >
          <Input
            aria-label="游戏可执行文件路径"
            className="border"
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            placeholder="例如 C:\Games\MyGame\game.exe"
            disabled={isLaunching}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLaunching}
            >
              取消
            </Button>
            <Button type="submit" disabled={isLaunching}>
              {isLaunching ? '启动中...' : '确认并启动'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
