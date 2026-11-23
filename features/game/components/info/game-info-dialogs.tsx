import GameBasicInfoDialog from '../dialog/game-basic-info-dialog'
import GameOSTDialog from '../dialog/game-ost-dialog'
import GamePlayStatusDialog from '../dialog/game-play-status-dialog'
import GamePlayTimeDialog from '../dialog/game-play-time-dialog'
import GameRatingDialog from '../dialog/game-rating-dialog'
import GameUpdateDataDialog from '../dialog/game-update-data-dialog'
import GameSettingsPanel from '../game-settings-panel'
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

import type { useGameInfo } from '../../hooks/use-game-info'

type GameInfoDialogsProps = ReturnType<typeof useGameInfo>['dialogs']

export default function GameInfoDialogs({
  basicInfo,
  updateData,
  settings,
  playTime,
  rating,
  ost,
  playStatus,
  exePath,
}: GameInfoDialogsProps) {
  return (
    <>
      <GameSettingsPanel {...settings} />
      <GameBasicInfoDialog {...basicInfo} />
      <GameUpdateDataDialog {...updateData} />
      <GamePlayTimeDialog {...playTime} />
      <GameRatingDialog {...rating} />
      <GameOSTDialog {...ost} />
      {playStatus.open && <GamePlayStatusDialog key={playStatus.gameId} {...playStatus} />}
      <Dialog open={exePath.open} onOpenChange={exePath.onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>填写游戏可执行文件路径</DialogTitle>
            <DialogDescription>当前游戏缺少可执行文件路径，请补充后再启动。</DialogDescription>
          </DialogHeader>
          <Input
            {...exePath.inputProps}
            aria-label="游戏可执行文件路径"
            placeholder="例如: C:\\Games\\MyGame\\game.exe"
            disabled={exePath.isLaunching}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => exePath.onOpenChange(false)}
              disabled={exePath.isLaunching}
            >
              取消
            </Button>
            <Button type="button" onClick={exePath.onConfirm} disabled={exePath.isLaunching}>
              {exePath.isLaunching ? '启动中...' : '确认并启动'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
