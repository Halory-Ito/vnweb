import { useAtomValue } from 'jotai'
import { FolderPlusIcon, Trash2Icon } from 'lucide-react'
import Link from 'next/link'

import { useLibraryFolderLogos } from '../hooks/use-library-folder-logos'
import { useLibraryFolders } from '../hooks/use-library-folders'
import { LIBRARY_GROUP_LABELS } from '../lib/library-grouping'
import GameHomeGrid from './game-home-grid'
import LibraryFolderCard from './library-folder-card'
import SelectableGameGrid from './selectable-game-grid'
import { Button } from '@/components/ui/button'
import { folderPaletteAtom, getFolderPaletteColor } from '@/lib/settings/game-library-folder-colors'

import type { LibraryGroup } from '../lib/library-grouping'
import type { GameCardsData, SelectableGameProps } from '../views/game-home'
import type { CollectionItem } from '@/types'

export default function LibraryFolders({
  games,
  collections,
  groupBy,
  showSections,
  onCreate,
  onDelete,
  ...selection
}: {
  games: GameCardsData
  collections: CollectionItem[]
  groupBy: LibraryGroup
  showSections: boolean
  onCreate: () => void
  onDelete: (id: number) => void
} & SelectableGameProps) {
  const { groupedFolders, customFolders } = useLibraryFolders(games, collections, groupBy)
  const groupLabel = LIBRARY_GROUP_LABELS[groupBy]
  const palette = useAtomValue(folderPaletteAtom)
  const logos = useLibraryFolderLogos(!showSections)

  return (
    <>
      {showSections && games.length ? (
        groupedFolders
          .filter((folder) => folder.games.length > 0)
          .map(({ href, title, games }) => (
            <section key={href} className="min-w-0 space-y-3">
              <h2 className="text-base font-semibold wrap-break-word">{title}</h2>
              <SelectableGameGrid games={games} {...selection} />
            </section>
          ))
      ) : (
        <section className="space-y-3" aria-label={groupLabel}>
          <h2 className="text-base font-semibold">{groupLabel}</h2>
          {!showSections && groupedFolders.length ? (
            <GameHomeGrid folders>
              {groupedFolders.map((folder, index) => (
                <LibraryFolderCard
                  key={folder.href}
                  {...folder}
                  logo={folder.canSetLogo ? logos?.[folder.href] : undefined}
                  paletteColor={getFolderPaletteColor(palette, index)}
                />
              ))}
            </GameHomeGrid>
          ) : (
            <p className="text-muted-foreground text-sm">暂无可分类的游戏</p>
          )}
        </section>
      )}
      <section className="space-y-3" aria-label="收藏夹">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold">收藏夹</h2>
          <Button type="button" variant="outline" size="sm" onClick={onCreate}>
            <FolderPlusIcon /> 新建收藏夹
          </Button>
        </div>
        {customFolders.length === 0 ? (
          <p className="text-muted-foreground text-sm">暂无收藏夹</p>
        ) : showSections ? (
          <div className="flex min-w-0 flex-col gap-6">
            {customFolders.map(({ id, href, title, games }) => (
              <section key={id} className="flex min-w-0 flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="min-w-0 text-base font-semibold wrap-break-word">
                    <Link href={href} className="hover:underline">
                      {title}
                    </Link>
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    className="shrink-0"
                    aria-label={`删除收藏夹：${title}`}
                    onClick={() => onDelete(id)}
                  >
                    <Trash2Icon />
                  </Button>
                </div>
                {games.length ? (
                  <SelectableGameGrid games={games} {...selection} />
                ) : (
                  <p className="text-muted-foreground text-sm">该收藏夹暂无游戏</p>
                )}
              </section>
            ))}
          </div>
        ) : (
          <GameHomeGrid folders>
            {customFolders.map(({ id, ...folder }, index) => (
              <LibraryFolderCard
                key={id}
                {...folder}
                canSetLogo
                localLogoOnly
                logo={logos?.[folder.href]}
                paletteColor={getFolderPaletteColor(palette, groupedFolders.length + index)}
                onDelete={() => onDelete(id)}
              />
            ))}
          </GameHomeGrid>
        )}
      </section>
    </>
  )
}
