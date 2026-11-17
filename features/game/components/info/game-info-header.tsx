import { Play, Settings, Square } from 'lucide-react'

import GameCover from './game-cover'
import { Button } from '@/components/ui/button'

import type { GameDetail } from '@/types'

type GameInfoHeaderProps = {
  game: GameDetail
  title: string
  isRunning: boolean
  isLaunching: boolean
  isStopping: boolean
  onLaunch: () => void
  onStop: () => void
  onOpenSettings: () => void
}

export default function GameInfoHeader({
  game,
  title,
  isRunning,
  isLaunching,
  isStopping,
  onLaunch,
  onStop,
  onOpenSettings,
}: GameInfoHeaderProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 rounded-md p-4 md:flex-row md:justify-between md:gap-8">
      <div className="min-w-0 space-y-3 text-center md:text-left">
        {game.logo ? (
          <img
            src={game.logo}
            alt={`${title} 徽标`}
            className="mx-auto max-h-20 w-auto max-w-full object-contain md:mx-0 md:max-h-32"
          />
        ) : null}
        <div className="text-xl font-bold wrap-break-word md:text-2xl">{title || '-'}</div>
        <div className="text-sm wrap-break-word">{game.name || '-'}</div>
        <div className="flex flex-wrap justify-center gap-2 md:justify-start">
          {isRunning ? (
            <Button variant="destructive" disabled={isStopping} onClick={onStop}>
              <Square className="size-4" />
              {isStopping ? '结束中...' : '结束游戏'}
            </Button>
          ) : (
            <Button variant="outline" disabled={isLaunching} onClick={onLaunch}>
              <Play className="size-4" />
              {isLaunching ? '启动中...' : '开始游戏'}
            </Button>
          )}
          <Button variant="outline" onClick={onOpenSettings}>
            <Settings className="size-4" />
            设置
          </Button>
        </div>
      </div>
      <div className="mx-2 my-2 w-fit shrink-0 md:my-0">
        <GameCover cover={game.cover} title={title} />
      </div>
    </div>
  )
}
