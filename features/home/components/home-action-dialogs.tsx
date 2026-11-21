'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import GameBulkUpdateMetadataDialog from '@/features/game/components/dialog/game-bulk-update-metadata-dialog'
import GameMergeDialog from '@/features/game/components/dialog/game-merge-dialog'

import type { GameCardsData } from '../views/game-home'

type HomeActionDialogsProps = {
  selectedGameIds: string[]
  selectedCount: number
  selectedCollectionCount: number
  gameCards: GameCardsData
  deleteConfirmOpen: boolean
  isDeletingGames: boolean
  onDeleteConfirmOpenChange: (open: boolean) => void
  onDeleteGames: () => void
  deleteCollectionsConfirmOpen: boolean
  isDeletingCollections: boolean
  onDeleteCollectionsConfirmOpenChange: (open: boolean) => void
  onDeleteCollections: () => void
  createCollectionOpen: boolean
  newCollectionName: string
  isAddingToCollection: boolean
  onCreateCollectionOpenChange: (open: boolean) => void
  onNewCollectionNameChange: (value: string) => void
  onCreateCollectionAndAdd: () => void
  metadataDialogOpen: boolean
  onMetadataDialogOpenChange: (open: boolean) => void
  mergeDialogOpen: boolean
  onMergeDialogOpenChange: (open: boolean) => void
  onClearSelection: () => void
}

export function HomeActionDialogs({
  selectedGameIds,
  selectedCount,
  selectedCollectionCount,
  gameCards,
  deleteConfirmOpen,
  isDeletingGames,
  onDeleteConfirmOpenChange,
  onDeleteGames,
  deleteCollectionsConfirmOpen,
  isDeletingCollections,
  onDeleteCollectionsConfirmOpenChange,
  onDeleteCollections,
  createCollectionOpen,
  newCollectionName,
  isAddingToCollection,
  onCreateCollectionOpenChange,
  onNewCollectionNameChange,
  onCreateCollectionAndAdd,
  metadataDialogOpen,
  onMetadataDialogOpenChange,
  mergeDialogOpen,
  onMergeDialogOpenChange,
  onClearSelection,
}: HomeActionDialogsProps) {
  return (
    <>
      <AlertDialog open={deleteConfirmOpen} onOpenChange={onDeleteConfirmOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除游戏</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将永久删除选中的 {selectedCount} 个游戏记录，无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingGames}>取消</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeletingGames}
              onClick={(e) => {
                e.preventDefault()
                onDeleteGames()
              }}
            >
              {isDeletingGames ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteCollectionsConfirmOpen}
        onOpenChange={onDeleteCollectionsConfirmOpenChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除收藏夹</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将删除选中的 {selectedCollectionCount} 个收藏夹，收藏夹内的游戏不会被删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingCollections}>取消</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeletingCollections}
              onClick={(e) => {
                e.preventDefault()
                onDeleteCollections()
              }}
            >
              {isDeletingCollections ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={createCollectionOpen} onOpenChange={onCreateCollectionOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedCount > 0 ? '新建合集并添加' : '新建文件夹'}</DialogTitle>
            <DialogDescription>
              {selectedCount > 0
                ? `将当前选中的 ${selectedCount} 个游戏添加到新合集中。`
                : '输入用于分类游戏的文件夹名称。'}
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="请输入合集名称..."
            value={newCollectionName}
            onChange={(e) => onNewCollectionNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing && !isAddingToCollection) {
                onCreateCollectionAndAdd()
              }
            }}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onCreateCollectionOpenChange(false)}
            >
              取消
            </Button>
            <Button
              type="button"
              disabled={isAddingToCollection}
              onClick={onCreateCollectionAndAdd}
            >
              {isAddingToCollection ? '创建中…' : selectedCount > 0 ? '创建并添加' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <GameBulkUpdateMetadataDialog
        open={metadataDialogOpen}
        onOpenChange={onMetadataDialogOpenChange}
        gameIds={selectedGameIds}
      />

      <GameMergeDialog
        open={mergeDialogOpen}
        onOpenChange={onMergeDialogOpenChange}
        gameIds={selectedGameIds}
        gameNames={Object.fromEntries(
          selectedGameIds.map((id) => [id, gameCards.find((g) => g.id === id)?.title || id]),
        )}
        onMergeComplete={onClearSelection}
      />
    </>
  )
}
