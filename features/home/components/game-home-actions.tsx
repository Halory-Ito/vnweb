import { HomeActionDialogs } from './home-action-dialogs'
import SelectedMenu from './selected-menu'

import type { useGameHome } from '../hooks/use-game-home'

export function GameHomeActions({ home }: { home: ReturnType<typeof useGameHome> }) {
  return (
    <>
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
    </>
  )
}
