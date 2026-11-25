'use client'

import { useGameInfoTabs } from '../../hooks/use-game-info-tabs'
import GameCharacters from './game-characters'
import GameMemory from './game-memory'
import GameOST from './game-ost'
import GameOverview from './game-overview'
import GamePV from './game-pv'
import GameQuote from './game-quote'
import GameRecord from './game-record'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import GameGuideView from '@/features/guide/views/game-guide-view'

import type { GameDetail } from '@/types'

export default function GameInfoTabs({ game }: { game: GameDetail }) {
  const { currentTab, handleTabChange, searchGame } = useGameInfoTabs(game.id)

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange} className="mx-auto w-full">
      <div className="-mx-4 scrollbar-none overflow-x-auto px-4 md:mx-0 md:px-0">
        <TabsList className="mx-auto w-max dark:bg-transparent">
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="characters">相关人物</TabsTrigger>
          <TabsTrigger value="pv">PV</TabsTrigger>
          <TabsTrigger value="ost">OST</TabsTrigger>
          <TabsTrigger value="record">记录</TabsTrigger>
          <TabsTrigger value="memory">回忆</TabsTrigger>
          <TabsTrigger value="quote">摘录</TabsTrigger>
          <TabsTrigger value="guide">攻略</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="overview">
        <GameOverview game={game} onSearch={searchGame} />
      </TabsContent>
      <TabsContent value="characters">
        <GameCharacters gameId={game.id} />
      </TabsContent>
      <TabsContent value="pv">
        <GamePV gameId={game.id} />
      </TabsContent>
      <TabsContent value="ost">
        <GameOST key={game.id} gameId={game.id} cover={game.cover} bg={game.bg} />
      </TabsContent>
      <TabsContent value="record">
        <GameRecord gameId={game.id} />
      </TabsContent>
      <TabsContent value="memory">
        <GameMemory gameId={game.id} />
      </TabsContent>
      <TabsContent value="quote">
        <GameQuote gameId={game.id} />
      </TabsContent>
      <TabsContent value="guide">
        <GameGuideView gameId={game.id} />
      </TabsContent>
    </Tabs>
  )
}
