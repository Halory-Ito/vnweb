import GameHomeGrid from './game-home-grid'
import GameCard from '@/features/game/components/game-card'

import type { GameCardsData, SelectableGameProps } from '../views/game-home'

export default function SelectableGameGrid({
  games,
  selectedGameIds,
  selectionMode,
  onToggleSelect,
}: SelectableGameProps & { games: GameCardsData }) {
  const selectedIds = new Set(selectedGameIds)

  return (
    <GameHomeGrid>
      {games.map((game) => (
        <GameCard
          key={game.id}
          {...game}
          isSelected={selectedIds.has(game.id)}
          showSelection
          selectionMode={selectionMode}
          onToggleSelect={onToggleSelect}
        />
      ))}
    </GameHomeGrid>
  )
}
