'use client'

import GameCharacters from '../components/info/game-characters'
import GameInfoDialogs from '../components/info/game-info-dialogs'
import GameInfoHeader from '../components/info/game-info-header'
import GameMemory from '../components/info/game-memory'
import GameOST from '../components/info/game-ost'
import GameOverview from '../components/info/game-overview'
import GamePV from '../components/info/game-pv'
import GameQuote from '../components/info/game-quote'
import GameRecord from '../components/info/game-record'
import GameStats from '../components/info/game-stats'
import { useGameInfo } from '../hooks/use-game-info'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import GameGuideView from '@/features/guide/views/game-guide-view'

import type { GameDetail } from '@/types'

type GameInfoProps = {
  game: GameDetail
  initialTab?: string
}

export default function GameInfo({ game, initialTab }: GameInfoProps) {
  const info = useGameInfo(game, initialTab)

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="w-full space-y-6 p-4 md:p-6">
          <GameInfoHeader {...info.headerProps} />
          <GameStats {...info.statsProps} />
          <Tabs
            value={info.currentTab}
            onValueChange={info.handleTabChange}
            className="mx-auto w-full"
          >
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
              <GameOverview game={game} onSearch={info.searchGame} />
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
