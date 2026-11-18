'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import {
  addGameToCollection,
  batchMarkNsfw,
  createCollection,
  deleteCollectionById,
  deleteGameById,
  getCollections,
  getGameCardList,
} from '@/api'
import { selectedGameIdsAtom, showNsfwAtom } from '@/atom/global'

function getErrorMessage(error: unknown, fallback: string) {
  const err = error as {
    response?: { data?: { error?: string } }
    message?: string
  }
  return err.response?.data?.error || err.message || fallback
}

export function useGameHome() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [selectedGameIds, setSelectedGameIds] = useAtom(selectedGameIdsAtom)
  const [showNsfw] = useAtom(showNsfwAtom)

  const [isAddingToCollection, setIsAddingToCollection] = useState(false)
  const [isDeletingGames, setIsDeletingGames] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([])
  const [isDeletingCollections, setIsDeletingCollections] = useState(false)
  const [deleteCollectionsConfirmOpen, setDeleteCollectionsConfirmOpen] = useState(false)
  const [metadataDialogOpen, setMetadataDialogOpen] = useState(false)
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false)
  const [isMarkingNsfw, setIsMarkingNsfw] = useState(false)
  const [createCollectionOpen, setCreateCollectionOpen] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')

  const gameCardsQuery = useQuery({
    queryKey: ['game-cards', showNsfw],
    queryFn: () => getGameCardList({ includeNsfw: showNsfw }),
  })

  const collectionsQuery = useQuery({
    queryKey: ['collections'],
    queryFn: getCollections,
  })

  const gameCards = gameCardsQuery.data ?? []
  const collections = collectionsQuery.data ?? []
  const allGameIds = gameCards.map((item) => item.id)

  useEffect(() => {
    const allGameIdSet = new Set(allGameIds)
    setSelectedGameIds((prev) => {
      const next = prev.filter((id) => allGameIdSet.has(id))
      return next.length === prev.length ? prev : next
    })
  }, [allGameIds, setSelectedGameIds])

  useEffect(() => {
    const allCollectionIdSet = new Set(collections.map((item) => `collection-${item.id}`))
    setSelectedCollectionIds((prev) => {
      const next = prev.filter((id) => allCollectionIdSet.has(id))
      return next.length === prev.length ? prev : next
    })
  }, [collections])

  const handleToggleSelect = (id: string) => {
    setSelectedGameIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const handleCancelSelection = () => setSelectedGameIds([])
  const handleSelectAll = () => setSelectedGameIds(allGameIds)

  const handleToggleCollectionSelect = (id: string) => {
    setSelectedCollectionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const handleClearCollectionSelection = () => setSelectedCollectionIds([])
  const handleSelectAllCollections = () => {
    setSelectedCollectionIds(collections.map((item) => `collection-${item.id}`))
  }

  const handleAddToCollection = async (collectionName: string) => {
    if (selectedGameIds.length === 0) return

    setIsAddingToCollection(true)
    try {
      const targetCollection =
        collections.find((item) => item.name === collectionName) ??
        (await createCollection(collectionName))

      const results = await Promise.allSettled(
        selectedGameIds.map((id) => addGameToCollection(targetCollection.id, Number(id))),
      )
      const successCount = results.filter((item) => item.status === 'fulfilled').length

      await queryClient.invalidateQueries({ queryKey: ['collections'] })
      await queryClient.invalidateQueries({ queryKey: ['game-sidebar'] })
      router.refresh()
      toast.success(`已添加 ${successCount}/${selectedGameIds.length} 项`)
    } catch (error) {
      toast.error(getErrorMessage(error, '添加合集失败'))
    } finally {
      setIsAddingToCollection(false)
    }
  }

  const handleCreateCollectionAndAdd = async () => {
    const collectionName = newCollectionName.trim()
    if (!collectionName) {
      toast.error('请输入新合集名称')
      return
    }
    await handleAddToCollection(collectionName)
    setCreateCollectionOpen(false)
    setNewCollectionName('')
  }

  const handleDeleteGames = async () => {
    if (selectedGameIds.length === 0) return

    setIsDeletingGames(true)
    try {
      const results = await Promise.allSettled(
        selectedGameIds.map((id) => deleteGameById(Number(id))),
      )
      const successCount = results.filter((item) => item.status === 'fulfilled').length

      await queryClient.invalidateQueries({ queryKey: ['game-cards'] })
      await queryClient.invalidateQueries({ queryKey: ['game'] })
      await queryClient.invalidateQueries({ queryKey: ['game-sidebar'] })
      await queryClient.invalidateQueries({ queryKey: ['collections'] })
      setSelectedGameIds([])
      setDeleteConfirmOpen(false)
      router.refresh()
      toast.success(`已删除 ${successCount}/${selectedGameIds.length} 项`)
    } catch (error) {
      toast.error(getErrorMessage(error, '删除游戏失败'))
    } finally {
      setIsDeletingGames(false)
    }
  }

  const handleBatchNsfw = async (isNsfw: boolean) => {
    if (selectedGameIds.length === 0) return

    setIsMarkingNsfw(true)
    try {
      const result = await batchMarkNsfw(selectedGameIds, isNsfw)
      await queryClient.invalidateQueries({ queryKey: ['game-cards'] })
      await queryClient.invalidateQueries({ queryKey: ['game-sidebar'] })
      setSelectedGameIds([])
      router.refresh()
      toast.success(`已将 ${result.data.updatedCount} 个游戏标记为 ${isNsfw ? 'NSFW' : 'SFW'}`)
    } catch (error) {
      toast.error(getErrorMessage(error, '标记 NSFW 失败'))
    } finally {
      setIsMarkingNsfw(false)
    }
  }

  const handleDeleteCollections = async () => {
    if (selectedCollectionIds.length === 0) return

    const collectionIds = selectedCollectionIds
      .map((id) => Number(id.replace('collection-', '')))
      .filter((id) => Number.isInteger(id) && id > 0)

    if (collectionIds.length === 0) {
      toast.error('未找到可删除的收藏夹')
      return
    }

    setIsDeletingCollections(true)
    try {
      const results = await Promise.allSettled(collectionIds.map((id) => deleteCollectionById(id)))
      const successCount = results.filter((item) => item.status === 'fulfilled').length

      await queryClient.invalidateQueries({ queryKey: ['collections'] })
      await queryClient.invalidateQueries({ queryKey: ['game-sidebar'] })
      setSelectedCollectionIds([])
      setDeleteCollectionsConfirmOpen(false)
      router.refresh()
      toast.success(`已删除 ${successCount}/${collectionIds.length} 个收藏夹`)
    } catch (error) {
      toast.error(getErrorMessage(error, '删除收藏夹失败'))
    } finally {
      setIsDeletingCollections(false)
    }
  }

  return {
    gameCardsQuery,
    collectionsQuery,
    gameCards,
    collections,
    allGameIds,
    selectedGameIds,
    selectionMode: selectedGameIds.length > 0,
    selectedCount: selectedGameIds.length,
    selectedCollectionIds,
    isAddingToCollection,
    isDeletingGames,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    isDeletingCollections,
    deleteCollectionsConfirmOpen,
    setDeleteCollectionsConfirmOpen,
    metadataDialogOpen,
    setMetadataDialogOpen,
    mergeDialogOpen,
    setMergeDialogOpen,
    isMarkingNsfw,
    createCollectionOpen,
    setCreateCollectionOpen,
    newCollectionName,
    setNewCollectionName,
    handleToggleSelect,
    handleCancelSelection,
    handleSelectAll,
    handleToggleCollectionSelect,
    handleClearCollectionSelection,
    handleSelectAllCollections,
    handleAddToCollection,
    handleCreateCollectionAndAdd,
    handleDeleteGames,
    handleBatchNsfw,
    handleDeleteCollections,
  }
}
