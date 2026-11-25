'use client'

import GameInfoDialogs from '../components/info/game-info-dialogs'
import GameInfoHeader from '../components/info/game-info-header'
import GameInfoTabs from '../components/info/game-info-tabs'
import GameStats from '../components/info/game-stats'
import { useGameInfo } from '../hooks/use-game-info'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'

import type { GameDetail } from '@/types'

type GameInfoProps = {
  game: GameDetail
}

export default function GameInfo({ game }: GameInfoProps) {
  const info = useGameInfo(game)

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="w-full space-y-6 p-4 md:p-6">
          <GameInfoHeader {...info.headerProps} />
          <GameStats {...info.statsProps} />
          <GameInfoTabs game={game} />
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        <ContextMenuItem onClick={info.onOpenBasicInfo}>修改基本信息</ContextMenuItem>
        <ContextMenuItem onClick={info.onOpenUpdateData}>更新资料数据</ContextMenuItem>
      </ContextMenuContent>
      <GameInfoDialogs {...info.dialogs} />
    </ContextMenu>
  )
}
