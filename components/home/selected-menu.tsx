import { CheckIcon, FolderPlusIcon, RefreshCcwIcon, Trash2Icon, XIcon } from 'lucide-react'
import React from 'react'

import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { CollectionItem } from '@/lib/game/game-utils'

type SelectedMenuProps = {
  selectedCount: number
  selectedGameIds: string[]
  allGameIds: string[]
  isAddingToCollection: boolean
  isMarkingNsfw: boolean
  isDeletingGames: boolean
  collections: CollectionItem[]
  setCreateCollectionOpen: (open: boolean) => void
  setMetadataDialogOpen: (open: boolean) => void
  setMergeDialogOpen: (open: boolean) => void
  setDeleteConfirmOpen: (open: boolean) => void
  handleAddToCollection: (collectionName: string) => Promise<void>
  handleBatchNsfw: (isNsfw: boolean) => Promise<void>
  handleCancelSelection: () => void
  handleSelectAll: () => void
}

export default function SelectedMenu({
  selectedCount,
  selectedGameIds,
  allGameIds,
  isAddingToCollection,
  isMarkingNsfw,
  isDeletingGames,
  collections,
  setCreateCollectionOpen,
  setMetadataDialogOpen,
  setMergeDialogOpen,
  setDeleteConfirmOpen,
  handleAddToCollection,
  handleBatchNsfw,
  handleCancelSelection,
  handleSelectAll,
}: SelectedMenuProps) {
  return (
    <div className="bg-background/95 fixed bottom-4 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-3xl -translate-x-1/2 rounded-lg border p-2 shadow-lg backdrop-blur">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isAddingToCollection}>
              <FolderPlusIcon className="size-4" />
              <span className="hidden sm:inline">添加到合集</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {collections.length === 0 ? (
              <DropdownMenuItem disabled>暂无合集</DropdownMenuItem>
            ) : (
              collections.map((collection) => (
                <DropdownMenuItem
                  key={collection.id}
                  onClick={() => void handleAddToCollection(collection.name)}
                >
                  {collection.name}
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuItem
              onClick={() => {
                setCreateCollectionOpen(true)
              }}
            >
              + 新建合集
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" size="sm" onClick={() => setMetadataDialogOpen(true)}>
          <RefreshCcwIcon className="size-4" />
          <span className="hidden sm:inline">更新元数据</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isMarkingNsfw}>
              NSFW
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => void handleBatchNsfw(true)}>
              标记为 NSFW
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void handleBatchNsfw(false)}>
              取消 NSFW 标记
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="outline"
          size="sm"
          disabled={selectedGameIds.length < 2}
          onClick={() => setMergeDialogOpen(true)}
        >
          合并
        </Button>
        <Button
          variant="destructive"
          size="sm"
          disabled={isDeletingGames}
          onClick={() => setDeleteConfirmOpen(true)}
        >
          <Trash2Icon className="size-4" />
          <span className="hidden sm:inline">删除</span>
        </Button>
        <Button variant="outline" size="sm" onClick={handleCancelSelection}>
          <XIcon className="size-4" />
          <span className="hidden sm:inline">取消</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={selectedGameIds.length === allGameIds.length}
          onClick={handleSelectAll}
        >
          <CheckIcon className="size-4" />
          <span className="hidden sm:inline">全选</span>
        </Button>
        <span className="text-muted-foreground w-full text-center text-xs sm:w-auto sm:text-sm">
          已选择 {selectedCount} 项
        </span>
      </div>
    </div>
  )
}
