'use client'

import { PlusIcon, SearchIcon } from 'lucide-react'

import { useGameMemory } from '../../hooks/use-game-memory'
import { useGameMemoryBatchDelete } from '../../hooks/use-game-memory-batch-delete'
import { GameMemoryBatchControls } from './game-memory-batch-controls'
import { GameMemoryCard } from './game-memory-card'
import { GameMemoryFormDialog } from './game-memory-form-dialog'
import { Button } from '@/components/ui/button'
import { EmptyArtwork } from '@/components/ui/empty-artwork'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Skeleton } from '@/components/ui/skeleton'

type GameMemoryProps = {
  gameId: number
}

export default function GameMemory({ gameId }: GameMemoryProps) {
  const memory = useGameMemory(gameId)
  const batch = useGameMemoryBatchDelete(gameId, memory.items)

  return (
    <div className="space-y-5 pt-2 pb-40">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2 sm:max-w-md">
          <InputGroup className="flex-1">
            <InputGroupInput
              value={memory.keywordInput}
              onChange={(event) => memory.setKeywordInput(event.target.value)}
              placeholder="搜索回忆..."
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  memory.handleSearch()
                }
              }}
            />
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
          </InputGroup>
          <Button
            type="button"
            variant="outline"
            disabled={memory.isLoading || memory.isRefetching}
            onClick={memory.handleSearch}
          >
            搜索
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <GameMemoryBatchControls batch={batch} hasItems={memory.items.length > 0} />
          <Button type="button" variant="outline" onClick={memory.openCreateDialog}>
            <PlusIcon />
            新增回忆
          </Button>
        </div>
      </div>

      {memory.isLoading ? (
        <div className="@container">
          <div className="grid grid-cols-1 gap-4 @lg:grid-cols-2 @4xl:grid-cols-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-xl border">
                <Skeleton className="aspect-video w-full rounded-none" />
                <div className="space-y-2 px-3.5 py-3">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : memory.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-12 text-center">
          <EmptyArtwork />
          <p className="text-sm font-medium">暂无回忆</p>
          <Button type="button" variant="outline" size="sm" onClick={memory.openCreateDialog}>
            <PlusIcon />
            新增回忆
          </Button>
        </div>
      ) : (
        <div className="@container">
          <div className="grid grid-cols-1 gap-4 @lg:grid-cols-2 @4xl:grid-cols-3">
            {memory.items.map((item) => (
              <GameMemoryCard
                key={item.id}
                gameId={gameId}
                item={item}
                selectionMode={batch.active}
                isSelected={batch.selectedIds.has(item.id)}
                onToggleSelect={batch.toggle}
              />
            ))}
          </div>
        </div>
      )}

      <GameMemoryFormDialog
        mode="create"
        gameId={gameId}
        open={memory.dialogOpen}
        isSaving={memory.isSaving}
        imagePreviewUrl={memory.imagePreviewUrl}
        title={memory.title}
        summary={memory.summary}
        tagsInput={memory.tagsInput}
        ostSongIds={memory.ostSongIds}
        metadataValues={memory.metadataValues}
        extraEntries={memory.extraEntries}
        body={memory.body}
        onOpenChange={memory.handleDialogOpenChange}
        onSelectImage={memory.setImageFile}
        onClearImage={memory.clearImage}
        onTitleChange={memory.setTitle}
        onSummaryChange={memory.setSummary}
        onTagsInputChange={memory.setTagsInput}
        onOstSongIdsChange={memory.setOstSongIds}
        onMetadataValueChange={memory.setMetadataValue}
        onExtraEntriesChange={memory.setExtraEntries}
        onBodyChange={memory.setBody}
        onSubmit={() => void memory.handleCreate()}
      />
    </div>
  )
}
