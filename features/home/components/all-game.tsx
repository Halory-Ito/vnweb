import { ArrowDownIcon, ArrowUpIcon, Gamepad2Icon } from 'lucide-react'
import { useState } from 'react'

import { GameCardsData, SelectableGameProps } from '../views/game-home'
import AreaHeader from './area-header'
import GameHomeGrid from './game-home-grid'
import { Button } from '@/components/ui/button'
import GameCard from '@/features/game/components/game-card'
import { SortSelect } from '@/features/game/components/sort-select'

type AllGameProps = SelectableGameProps & {
  gameCards: GameCardsData
  title?: string
}

const AllGame = ({
  gameCards,
  title = '所有游戏',
  selectedGameIds,
  selectionMode,
  onToggleSelect,
}: AllGameProps) => {
  const [order, setOrder] = useState<string>('asc')
  const [orderBy, setOrderBy] = useState<string>('add_date')

  const items: GameCardProps[] = [...gameCards]

  items.sort((a, b) => {
    let compare = 0
    switch (orderBy) {
      case 'name':
        compare = a.title.localeCompare(b.title)
        break
      case 'public_date':
        compare = new Date(a.publishAt).getTime() - new Date(b.publishAt).getTime()
        break
      case 'last_run':
        compare = new Date(a.lastRunAt).getTime() - new Date(b.lastRunAt).getTime()
        break
      case 'add_date':
        compare = new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime()
        break
      case 'play_time':
        compare = a.playTime - b.playTime
        break
      case 'rating':
        compare = a.rating - b.rating
        break
    }
    return order === 'asc' ? compare : -compare
  })
  return (
    <section className="min-w-0 space-y-3">
      <div className="bg-background dark:bg-input/30 dark:border-input flex flex-wrap items-center justify-between gap-2 rounded-xl p-3">
        <AreaHeader icon={Gamepad2Icon} title={title} count={items.length} />

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground hidden text-sm font-medium @min-[36rem]/library:inline">
            排序依据
          </span>
          <SortSelect orderBy={orderBy} setOrderBy={setOrderBy} />
          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            aria-label={order === 'asc' ? '切换为降序' : '切换为升序'}
            onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')}
          >
            {order === 'asc' ? (
              <ArrowDownIcon className="size-4" />
            ) : (
              <ArrowUpIcon className="size-4" />
            )}
          </Button>
        </div>
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

export default AllGame
