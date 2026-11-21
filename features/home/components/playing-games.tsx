import { Gamepad2Icon } from 'lucide-react'

import { GameCardsData, SelectableGameProps } from '../views/game-home'
import AreaHeader from './area-header'
import GameHomeGrid from './game-home-grid'
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
    <section className="min-w-0 space-y-3">
      <div className="bg-background dark:bg-input/30 dark:border-input flex items-center rounded-xl p-3">
        <AreaHeader icon={Gamepad2Icon} title="正在游玩" count={items.length} />
      </div>
      <GameHomeGrid>
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
      </GameHomeGrid>
    </section>
  )
}

export default PlayingGames
