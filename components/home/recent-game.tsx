import { HistoryIcon } from 'lucide-react'

import GameCard from '../game/game-card'
import { GameCardsData, SelectableGameProps } from './game-home'
import { Badge } from '@/components/ui/badge'
type RecentGameProps = SelectableGameProps & {
  gameCards: GameCardsData
}

const RecentGame = ({
  gameCards,
  selectedGameIds,
  selectionMode,
  onToggleSelect,
}: RecentGameProps) => {
  const items: GameCardProps[] = gameCards
    .filter((item) => item.lastRunAt)
    .sort((a, b) => new Date(b.lastRunAt).getTime() - new Date(a.lastRunAt).getTime())
    .slice(0, 6)

  if (items.length === 0) {
    return null
  }

  return (
    <div className="h-full w-full">
      <div className="bg-background/30 mb-4 flex items-center justify-between rounded-xl p-3">
        <div className="flex items-center gap-3">
          <HistoryIcon size={24} />
          <div className="text-xl font-bold">最近游戏</div>
          <Badge variant={'outline'}>共 {items.length} 项</Badge>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {items.map((item) => (
          <GameCard
            key={item.id}
            {...item}
            isSelected={selectedGameIds.includes(item.id)}
            showSelection
            selectionMode={selectionMode}
            onToggleSelect={onToggleSelect}
          />
        ))}
      </div>
    </div>
  )
}

export default RecentGame
