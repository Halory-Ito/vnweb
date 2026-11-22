import { useAtomValue } from 'jotai'
import { useMemo } from 'react'

import { GameHomeActions } from '../components/game-home-actions'
import LibraryFolderContextMenu from '../components/library-folder-context-menu'
import { useGameHome } from '../hooks/use-game-home'
import { GameSidebarContent } from '@/features/game/components/game-sidebar'
import { useGameSidebar } from '@/features/game/hooks/use-game-sidebar'
import { gameLibraryGroupAtom } from '@/lib/settings/game-library-group'

export default function GameListHome() {
  const query = useGameSidebar()
  const groupBy = useAtomValue(gameLibraryGroupAtom)
  const listGameIds = useMemo(() => {
    if (!query.data) return undefined
    return [...new Set(query.data.items.flatMap(({ items }) => items.map(({ id }) => id)))]
  }, [query.data])
  const home = useGameHome({
    groupBy,
    foldersOnly: false,
    showGameFilters: false,
    keyword: '',
    listGameIds,
  })
  const createCollection = () => home.setCreateCollectionOpen(true)

  return (
    <div className="flex h-[100cqh] min-w-0 flex-col overflow-y-auto p-2 sm:p-4">
      <div className="shrink-0">
        <GameSidebarContent {...query} onCreateCollection={createCollection} />
      </div>
      <LibraryFolderContextMenu onCreate={createCollection}>
        <div role="region" aria-label="游戏列表操作" tabIndex={0} className="min-h-8 flex-1" />
      </LibraryFolderContextMenu>
      <GameHomeActions home={home} />
    </div>
  )
}
