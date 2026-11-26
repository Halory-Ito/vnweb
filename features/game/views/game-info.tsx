'use client'

import GameInfoDialogs from '../components/info/game-info-dialogs'
import GameInfoHeader from '../components/info/game-info-header'
import GameInfoTabs from '../components/info/game-info-tabs'
import GameStats from '../components/info/game-stats'
import { useGameInfo } from '../hooks/use-game-info'

import type { GameDetail } from '@/types'

type GameInfoProps = {
  game: GameDetail
}

export default function GameInfo({ game }: GameInfoProps) {
  const info = useGameInfo(game)

  return (
    <>
      <div className="w-full space-y-6 p-4 md:p-6">
        <GameInfoHeader {...info.headerProps} />
        <GameStats {...info.statsProps} />
        <GameInfoTabs game={game} />
      </div>
      <GameInfoDialogs {...info.dialogs} />
    </>
  )
}
