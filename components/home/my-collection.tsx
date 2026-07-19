import { BookMarkedIcon, CheckIcon, Trash2Icon, XIcon } from 'lucide-react'

import GameCard from '../game/game-card'
import AreaHeader from './area-header'
import { Button } from '@/components/ui/button'
import { getCollections } from '@/lib/game/game-utils'

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
    <div className="h-full w-full">
      <div className="bg-background/30 mb-4 flex flex-col gap-3 rounded-xl p-3 sm:flex-row sm:items-center sm:justify-between">
        <AreaHeader icon={BookMarkedIcon} title="我的收藏" count={items.length} />
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
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
            <div className="text-muted-foreground text-xs">可按住 Ctrl 或 ⌘ 点击选择收藏夹</div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
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
      </div>
    </div>
  )
}

export default MyColletion
