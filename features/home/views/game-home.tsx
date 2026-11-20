'use client'

import { AlertCircle, SearchX } from 'lucide-react'
import Link from 'next/link'

import GameHomeEmptyState from '../components/empty-home'
import { HomeActionDialogs } from '../components/home-action-dialogs'
import SelectedMenu from '../components/selected-menu'
import { useGameHome } from '../hooks/use-game-home'
import { getGameCardList } from '@/api'
import { Button } from '@/components/ui/button'
import AllGame from '@/features/home/components/all-game'
import GameHomeSkeleton from '@/features/home/components/home-skeleton'
import MyColletion from '@/features/home/components/my-collection'
import RecentGame from '@/features/home/components/recent-game'

export type SelectableGameProps = {
  selectedGameIds: string[]
  selectionMode: boolean
  onToggleSelect: (id: string) => void
}

export type GameCardsData = Awaited<ReturnType<typeof getGameCardList>>

export default function GameHome() {
  const home = useGameHome()

  if (home.gameCardsQuery.isLoading || home.collectionsQuery.isLoading) {
    return <GameHomeSkeleton />
  }

  if (home.gameCardsQuery.isError || home.collectionsQuery.isError) {
    return (
      <GameHomeEmptyState
        icon={AlertCircle}
        title="加载游戏主页失败"
        description="当前无法获取游戏或收藏数据，请稍后重试。"
      >
        <Button
          type="button"
          variant="outline"
          disabled={home.gameCardsQuery.isRefetching || home.collectionsQuery.isRefetching}
          onClick={() => {
            void home.gameCardsQuery.refetch()
            void home.collectionsQuery.refetch()
          }}
        >
          {home.gameCardsQuery.isRefetching || home.collectionsQuery.isRefetching
            ? '重试中...'
            : '重新加载'}
        </Button>
        <Button asChild>
          <Link href="/scan">前往扫描游戏</Link>
        </Button>
      </GameHomeEmptyState>
    )
  }

  if (home.gameCards.length === 0 && home.collections.length === 0) {
    return (
      <GameHomeEmptyState
        icon={SearchX}
        title="暂无游戏"
        description="当前游戏库还没有数据。可以先扫描目录或手动导入。"
      >
        <Button asChild>
          <Link href="/scan">前往扫描游戏</Link>
        </Button>
      </GameHomeEmptyState>
    )
  }

  return (
    <div className="max-h-[100cqh] w-full space-y-12 overflow-x-hidden overflow-y-scroll p-4">
      <RecentGame
        gameCards={home.gameCards}
        selectedGameIds={home.selectedGameIds}
        selectionMode={home.selectionMode}
        onToggleSelect={home.handleToggleSelect}
      />
      <MyColletion
        collections={home.collections}
        selectedCollectionIds={home.selectedCollectionIds}
        isDeletingCollections={home.isDeletingCollections}
        onToggleSelectCollection={home.handleToggleCollectionSelect}
        onClearCollectionSelection={home.handleClearCollectionSelection}
        onSelectAllCollections={home.handleSelectAllCollections}
        onOpenDeleteCollections={() => home.setDeleteCollectionsConfirmOpen(true)}
      />
      <AllGame
        gameCards={home.gameCards}
        selectedGameIds={home.selectedGameIds}
        selectionMode={home.selectionMode}
        onToggleSelect={home.handleToggleSelect}
      />

      {home.selectionMode ? (
        <SelectedMenu
          selectedCount={home.selectedCount}
          selectedGameIds={home.selectedGameIds}
          allGameIds={home.allGameIds}
          isAddingToCollection={home.isAddingToCollection}
          isMarkingNsfw={home.isMarkingNsfw}
          isDeletingGames={home.isDeletingGames}
          collections={home.collections}
          setCreateCollectionOpen={home.setCreateCollectionOpen}
          setMetadataDialogOpen={home.setMetadataDialogOpen}
          setMergeDialogOpen={home.setMergeDialogOpen}
          setDeleteConfirmOpen={home.setDeleteConfirmOpen}
          handleAddToCollection={home.handleAddToCollection}
          handleBatchNsfw={home.handleBatchNsfw}
          handleCancelSelection={home.handleCancelSelection}
          handleSelectAll={home.handleSelectAll}
        />
      ) : null}

      <HomeActionDialogs
        selectedGameIds={home.selectedGameIds}
        selectedCount={home.selectedCount}
        selectedCollectionCount={home.selectedCollectionIds.length}
        gameCards={home.gameCards}
        deleteConfirmOpen={home.deleteConfirmOpen}
        isDeletingGames={home.isDeletingGames}
        onDeleteConfirmOpenChange={home.setDeleteConfirmOpen}
        onDeleteGames={() => void home.handleDeleteGames()}
        deleteCollectionsConfirmOpen={home.deleteCollectionsConfirmOpen}
        isDeletingCollections={home.isDeletingCollections}
        onDeleteCollectionsConfirmOpenChange={home.setDeleteCollectionsConfirmOpen}
        onDeleteCollections={() => void home.handleDeleteCollections()}
        createCollectionOpen={home.createCollectionOpen}
        newCollectionName={home.newCollectionName}
        isAddingToCollection={home.isAddingToCollection}
        onCreateCollectionOpenChange={home.setCreateCollectionOpen}
        onNewCollectionNameChange={home.setNewCollectionName}
        onCreateCollectionAndAdd={() => void home.handleCreateCollectionAndAdd()}
        metadataDialogOpen={home.metadataDialogOpen}
        onMetadataDialogOpenChange={home.setMetadataDialogOpen}
        mergeDialogOpen={home.mergeDialogOpen}
        onMergeDialogOpenChange={home.setMergeDialogOpen}
        onClearSelection={home.handleCancelSelection}
      />
    </div>
  )
}
