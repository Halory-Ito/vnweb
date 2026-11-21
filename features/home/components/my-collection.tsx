import { BookMarkedIcon, CheckIcon, Trash2Icon, XIcon } from 'lucide-react'

import AreaHeader from './area-header'
import GameHomeGrid from './game-home-grid'
import { getCollections } from '@/api'
import { Button } from '@/components/ui/button'
import GameCard from '@/features/game/components/game-card'

type CollectionsData = Awaited<ReturnType<typeof getCollections>>
type MyCollectionProps = {
  collections: CollectionsData
  selectedCollectionIds: string[]
  isDeletingCollections: boolean
  onToggleSelectCollection: (id: string) => void
  onClearCollectionSelection: () => void
  onSelectAllCollections: () => void
  onOpenDeleteCollections: () => void
}
const MyColletion = ({
  collections,
  selectedCollectionIds,
  isDeletingCollections,
  onToggleSelectCollection,
  onClearCollectionSelection,
  onSelectAllCollections,
  onOpenDeleteCollections,
}: MyCollectionProps) => {
  const items: GameCardProps[] = collections.map((collection) => {
    const firstGame = collection.games[0]
    return {
      id: `collection-${collection.id}`,
      href: `/game/collection/${collection.id}`,
      title: collection.name,
      cover: collection.firstGameCover || firstGame?.cover || '/LOGO.png',
      playTime: 0,
      publishAt: '',
      lastRunAt: '',
      addedAt: '',
      rating: 0,
    }
  })

  const collectionSelectionMode = selectedCollectionIds.length > 0

  if (items.length === 0) {
    return null
  }

  return (
    <section className="min-w-0 space-y-3">
      <div className="bg-background dark:bg-input/30 dark:border-input flex flex-wrap items-center justify-between gap-2 rounded-xl p-3">
        <AreaHeader icon={BookMarkedIcon} title="我的收藏" count={items.length} />
        <div className="flex flex-wrap items-center gap-2">
          {collectionSelectionMode ? (
            <>
              <Button
                variant="destructive"
                size="sm"
                disabled={isDeletingCollections}
                onClick={onOpenDeleteCollections}
              >
                <Trash2Icon className="size-4" />
                删除收藏夹
              </Button>
              <Button variant="outline" size="sm" onClick={onClearCollectionSelection}>
                <XIcon className="size-4" />
                取消
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={selectedCollectionIds.length === items.length}
                onClick={onSelectAllCollections}
              >
                <CheckIcon className="size-4" />
                全选
              </Button>
              <div className="text-sm font-medium">已选择 {selectedCollectionIds.length} 项</div>
            </>
          ) : (
            <div className="text-muted-foreground hidden text-xs @min-[36rem]/library:block [@media(hover:none)]:hidden">
              可按住 Ctrl 或 ⌘ 点击选择收藏夹
            </div>
          )}
        </div>
      </div>
      <GameHomeGrid>
        {items.map((item) => (
          <GameCard
            key={item.id}
            {...item}
            isSelected={selectedCollectionIds.includes(item.id)}
            showSelection
            selectionMode={collectionSelectionMode}
            modifierSelectEnabled
            showPlayInfo={false}
            onToggleSelect={onToggleSelectCollection}
          />
        ))}
      </GameHomeGrid>
    </section>
  )
}

export default MyColletion
