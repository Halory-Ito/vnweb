import { Gamepad2Icon } from 'lucide-react'

import { GameCardsData, SelectableGameProps } from '../views/game-home'
import AreaHeader from './area-header'
import GameCard from '@/features/game/components/game-card'
type PlayingGamesProps = SelectableGameProps & {
  items: GameCardsData
}

const PlayingGames = ({
  items,
  selectedGameIds,
  selectionMode,
  onToggleSelect,
}: PlayingGamesProps) => {
  if (items.length === 0) {
    return null
  }

  return (
    <div className="h-full w-full">
      <div className="bg-background dark:bg-input/30 dark:border-input mb-4 flex items-center justify-between rounded-xl p-3">
        <AreaHeader icon={Gamepad2Icon} title="正在游玩" count={items.length} />
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

export default PlayingGames
