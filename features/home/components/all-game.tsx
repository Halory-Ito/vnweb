import { Gamepad2Icon } from 'lucide-react'

import { useLibraryGameSort } from '../hooks/use-library-game-sort'
import { GameCardsData, SelectableGameProps } from '../views/game-home'
import AreaHeader from './area-header'
import LibraryFolderHeader from './library-folder-header'
import LibraryGameFilter, { type LibraryGameFilterProps } from './library-game-filter'
import LibraryGameSort from './library-game-sort'
import SelectableGameGrid from './selectable-game-grid'
import { Empty, EmptyTitle } from '@/components/ui/empty'
import { cn } from '@/lib/utils'

type AllGameProps = SelectableGameProps & {
  gameCards: GameCardsData
  title?: string
  headerVariant?: 'card' | 'plain' | 'folder'
  filters: LibraryGameFilterProps & { isSearching: boolean }
}

const AllGame = ({
  gameCards,
  title = '所有游戏',
  headerVariant = 'card',
  filters,
  selectedGameIds,
  selectionMode,
  onToggleSelect,
}: AllGameProps) => {
  const { items, ...sortControls } = useLibraryGameSort(gameCards)
  const controls = (
    <div className="flex flex-wrap items-center gap-2">
      <LibraryGameFilter {...filters} />
      <LibraryGameSort {...sortControls} />
    </div>
  )
  return (
    <section className="min-w-0 space-y-3">
      {headerVariant === 'folder' ? (
        <LibraryFolderHeader title={title}>{controls}</LibraryFolderHeader>
      ) : (
        <div
          className={cn(
            'flex flex-wrap items-center justify-between gap-2',
            headerVariant === 'card' &&
              'bg-background dark:bg-input/30 dark:border-input rounded-xl p-3',
          )}
        >
          <AreaHeader icon={Gamepad2Icon} title={title} count={items.length} />
          {controls}
        </div>
      )}
      {items.length ? (
        <SelectableGameGrid
          games={items}
          selectedGameIds={selectedGameIds}
          selectionMode={selectionMode}
          onToggleSelect={onToggleSelect}
        />
      ) : (
        <Empty className="min-h-44">
          <EmptyTitle>
            {filters.isSearching || filters.activeCount ? '没有符合条件的游戏' : '暂无游戏'}
          </EmptyTitle>
        </Empty>
      )}
    </section>
  )
}

export default AllGame
