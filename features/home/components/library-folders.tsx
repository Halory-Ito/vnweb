import { useAtomValue } from 'jotai'
import { FolderPlusIcon } from 'lucide-react'

import { useLibraryFolders } from '../hooks/use-library-folders'
import { LIBRARY_GROUP_LABELS } from '../lib/library-grouping'
import GameHomeGrid from './game-home-grid'
import LibraryFolderCard from './library-folder-card'
import { Button } from '@/components/ui/button'
import { folderPaletteAtom, getFolderPaletteColor } from '@/lib/settings/game-library-folder-colors'

import type { LibraryGroup } from '../lib/library-grouping'
import type { GameCardsData } from '../views/game-home'
import type { CollectionItem } from '@/types'

export default function LibraryFolders({
  games,
  collections,
  groupBy,
  onCreate,
  onDelete,
}: {
  games: GameCardsData
  collections: CollectionItem[]
  groupBy: LibraryGroup
  onCreate: () => void
  onDelete: (id: number) => void
}) {
  const { groupedFolders, customFolders } = useLibraryFolders(games, collections, groupBy)
  const groupLabel = LIBRARY_GROUP_LABELS[groupBy]
  const palette = useAtomValue(folderPaletteAtom)

  return (
    <>
      <section className="space-y-3" aria-label={groupLabel}>
        <h2 className="text-base font-semibold">{groupLabel}</h2>
        {groupedFolders.length ? (
          <GameHomeGrid folders>
            {groupedFolders.map((folder, index) => (
              <LibraryFolderCard
                key={folder.href}
                {...folder}
                paletteColor={getFolderPaletteColor(palette, index)}
              />
            ))}
          </GameHomeGrid>
        ) : (
          <p className="text-muted-foreground text-sm">暂无可分类的游戏</p>
        )}
      </section>
      <section className="space-y-3" aria-label="自定义文件夹">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold">自定义文件夹</h2>
          <Button type="button" variant="outline" size="sm" onClick={onCreate}>
            <FolderPlusIcon /> 新建文件夹
          </Button>
        </div>
        {customFolders.length ? (
          <GameHomeGrid folders>
            {customFolders.map(({ id, ...folder }, index) => (
              <LibraryFolderCard
                key={id}
                {...folder}
                paletteColor={getFolderPaletteColor(palette, groupedFolders.length + index)}
                onDelete={() => onDelete(id)}
              />
            ))}
          </GameHomeGrid>
        ) : (
          <p className="text-muted-foreground text-sm">暂无自定义文件夹</p>
        )}
      </section>
    </>
  )
}
