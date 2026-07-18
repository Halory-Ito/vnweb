import { ArrowDownIcon, ArrowUpIcon, Gamepad2Icon } from 'lucide-react'
import { useState } from 'react'

import GameCard from '../game/game-card'
import { SortSelect } from '../game/sort-select'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { GameCardsData, SelectableGameProps } from './game-home'

type AllGameProps = SelectableGameProps & {
  gameCards: GameCardsData
}

const AllGame = ({ gameCards, selectedGameIds, selectionMode, onToggleSelect }: AllGameProps) => {
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
    <div className="h-full w-full">
      <div className="bg-background/30 mb-4 flex flex-col gap-3 rounded-xl p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Gamepad2Icon size={24} />
          <div className="text-xl font-bold tracking-tight">所有游戏</div>
          <Badge variant={'outline'}>共 {items.length} 项</Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-sm font-medium">排序依据</span>
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

export default AllGame
