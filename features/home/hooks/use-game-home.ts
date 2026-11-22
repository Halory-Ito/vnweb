'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { getLibraryFolderKeys } from '../lib/library-grouping'
import { useLibraryGameFilters } from './use-library-game-filters'
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
import { useGameStatusNames } from '@/features/game/hooks/use-game-status-names'

import type { LibraryGroup } from '../lib/library-grouping'

function getErrorMessage(error: unknown, fallback: string) {
  const err = error as {
    response?: { data?: { error?: string } }
    message?: string
  }
  return err.response?.data?.error || err.message || fallback
}

export function useGameHome({
  groupBy,
  folderKey,
  foldersOnly,
  showGameFilters,
  listGameIds,
  keyword,
}: {
  groupBy: LibraryGroup
  folderKey?: string
  foldersOnly: boolean
  showGameFilters: boolean
  listGameIds?: string[]
  keyword: string
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [storedSelectedGameIds, setSelectedGameIds] = useAtom(selectedGameIdsAtom)
  const [showNsfw] = useAtom(showNsfwAtom)
  const { data: statusNames } = useGameStatusNames()

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
  const visibleGames = useMemo(() => {
    const games = gameCardsQuery.data ?? []
    if (foldersOnly) return []
    return folderKey === undefined
      ? games
      : games.filter((game) => getLibraryFolderKeys(game, groupBy, statusNames).includes(folderKey))
  }, [groupBy, folderKey, foldersOnly, gameCardsQuery.data, statusNames])
  const gameFilters = useLibraryGameFilters(visibleGames, keyword, statusNames)
  const selectableGames = showGameFilters ? gameFilters.filteredGames : visibleGames
  const allGameIds = useMemo(
    () => listGameIds ?? selectableGames.map(({ id }) => id),
    [listGameIds, selectableGames],
  )
  const visibleIds = useMemo(() => new Set(allGameIds), [allGameIds])
  const selectedGameIds = storedSelectedGameIds.filter((id) => visibleIds.has(id))

  useEffect(() => {
    if (!gameCardsQuery.data) return
    setSelectedGameIds((prev) => {
      const next = prev.filter((id) => visibleIds.has(id))
      return next.length === prev.length ? prev : next
    })
  }, [gameCardsQuery.data, setSelectedGameIds, visibleIds])

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
      toast.error(getErrorMessage(error, '添加到收藏夹失败'))
    } finally {
      setIsAddingToCollection(false)
    }
  }

  const handleCreateCollectionAndAdd = async () => {
    if (isAddingToCollection) return
    const collectionName = newCollectionName.trim()
    if (!collectionName) {
      toast.error('请输入新收藏夹名称')
      return
    }
    if (selectedGameIds.length > 0) {
      await handleAddToCollection(collectionName)
      setCreateCollectionOpen(false)
      setNewCollectionName('')
      return
    }

    if (collections.some(({ name }) => name === collectionName)) {
      toast.error('已存在同名收藏夹')
      return
    }

    setIsAddingToCollection(true)
    try {
      await createCollection(collectionName)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['collections'] }),
        queryClient.invalidateQueries({ queryKey: ['game-sidebar'] }),
      ])
      setCreateCollectionOpen(false)
      setNewCollectionName('')
      toast.success('已新建收藏夹')
    } catch (error) {
      toast.error(getErrorMessage(error, '新建收藏夹失败'))
    } finally {
      setIsAddingToCollection(false)
    }
  }

  const handleRequestDeleteCollection = (id: number) => {
    setSelectedCollectionIds([`collection-${id}`])
    setDeleteCollectionsConfirmOpen(true)
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
    visibleGames,
    gameFilters,
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
    handleRequestDeleteCollection,
  }
}
