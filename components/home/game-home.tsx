'use client'

import { useQuery } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import { AlertCircle, SearchX } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import GameBulkUpdateMetadataDialog from '../game/dialog/game-bulk-update-metadata-dialog'
import GameMergeDialog from '../game/dialog/game-merge-dialog'
import GameHomeEmptyState from './empty-home'
import SelectedMenu from './selected-menu'
import { selectedGameIdsAtom, showNsfwAtom } from '@/atom/global'
import AllGame from '@/components/home/all-game'
import GameHomeSkeleton from '@/components/home/home-skeleton'
import MyColletion from '@/components/home/my-collection'
import RecentGame from '@/components/home/recent-game'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  addGameToCollection,
  batchMarkNsfw,
  createCollection,
  deleteCollectionById,
  deleteGameById,
  getCollections,
  getGameCardList,
} from '@/lib/game/game-utils'

export type SelectableGameProps = {
  selectedGameIds: string[]
  selectionMode: boolean
  onToggleSelect: (id: string) => void
}

export type GameCardsData = Awaited<ReturnType<typeof getGameCardList>>

export default function GameHome() {
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
  const selectionMode = selectedGameIds.length > 0
  const selectedCount = selectedGameIds.length

  useEffect(() => {
    const allGameIdSet = new Set(allGameIds)
    setSelectedGameIds((prev) => {
      const next = prev.filter((id) => allGameIdSet.has(id))
      if (next.length === prev.length) {
        return prev
      }
      return next
    })
  }, [allGameIds, setSelectedGameIds])

  useEffect(() => {
    const allCollectionIdSet = new Set(collections.map((item) => `collection-${item.id}`))
    setSelectedCollectionIds((prev) => {
      const next = prev.filter((id) => allCollectionIdSet.has(id))
      if (next.length === prev.length) {
        return prev
      }
      return next
    })
  }, [collections])

  if (gameCardsQuery.isLoading || collectionsQuery.isLoading) {
    return <GameHomeSkeleton />
  }

  if (gameCardsQuery.isError || collectionsQuery.isError) {
    return (
      <GameHomeEmptyState
        icon={AlertCircle}
        title="加载游戏主页失败"
        description="当前无法获取游戏或收藏数据，请稍后重试。"
      >
        <Button
          type="button"
          variant="outline"
          disabled={gameCardsQuery.isRefetching || collectionsQuery.isRefetching}
          onClick={() => {
            void gameCardsQuery.refetch()
            void collectionsQuery.refetch()
          }}
        >
          {gameCardsQuery.isRefetching || collectionsQuery.isRefetching ? '重试中...' : '重新加载'}
        </Button>
        <Button asChild>
          <Link href="/scan">前往扫描游戏</Link>
        </Button>
      </GameHomeEmptyState>
    )
  }

  if (gameCards.length === 0 && collections.length === 0) {
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

  const handleToggleSelect = (id: string) => {
    setSelectedGameIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const handleCancelSelection = () => {
    setSelectedGameIds([])
  }

  const handleSelectAll = () => {
    setSelectedGameIds(allGameIds)
  }

  const handleAddToCollection = async (collectionName: string) => {
    if (selectedGameIds.length === 0) {
      return
    }

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
      const err = error as {
        response?: {
          data?: {
            error?: string
          }
        }
        message?: string
      }
      toast.error(err.response?.data?.error || err.message || '添加合集失败')
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
    if (selectedGameIds.length === 0) {
      return
    }

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
      const err = error as {
        response?: {
          data?: {
            error?: string
          }
        }
        message?: string
      }
      toast.error(err.response?.data?.error || err.message || '删除失败')
    } finally {
      setIsDeletingGames(false)
    }
  }

  const handleBatchNsfw = async (nsfw: boolean) => {
    if (selectedGameIds.length === 0) {
      return
    }

    setIsMarkingNsfw(true)
    try {
      await batchMarkNsfw(selectedGameIds, nsfw)
      await queryClient.invalidateQueries({ queryKey: ['game-cards'] })
      await queryClient.invalidateQueries({ queryKey: ['game-sidebar'] })
      router.refresh()
      toast.success(`已${nsfw ? '标记' : '取消标记'} ${selectedGameIds.length} 个游戏为 NSFW`)
    } catch (error) {
      const err = error as {
        response?: {
          data?: {
            error?: string
          }
        }
        message?: string
      }
      toast.error(err.response?.data?.error || err.message || '更新 NSFW 状态失败')
    } finally {
      setIsMarkingNsfw(false)
    }
  }

  const handleToggleCollectionSelect = (id: string) => {
    setSelectedCollectionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const handleClearCollectionSelection = () => {
    setSelectedCollectionIds([])
  }

  const handleSelectAllCollections = () => {
    setSelectedCollectionIds(collections.map((collection) => `collection-${collection.id}`))
  }

  const handleDeleteCollections = async () => {
    if (selectedCollectionIds.length === 0) {
      return
    }

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
      const err = error as {
        response?: {
          data?: {
            error?: string
          }
        }
        message?: string
      }
      toast.error(err.response?.data?.error || err.message || '删除收藏夹失败')
    } finally {
      setIsDeletingCollections(false)
    }
  }

  return (
    <div className="max-h-[calc(100vh-70px)] w-full space-y-12 overflow-x-hidden overflow-y-scroll p-4">
      <RecentGame
        gameCards={gameCards}
        selectedGameIds={selectedGameIds}
        selectionMode={selectionMode}
        onToggleSelect={handleToggleSelect}
      />
      <MyColletion
        collections={collections}
        selectedCollectionIds={selectedCollectionIds}
        isDeletingCollections={isDeletingCollections}
        onToggleSelectCollection={handleToggleCollectionSelect}
        onClearCollectionSelection={handleClearCollectionSelection}
        onSelectAllCollections={handleSelectAllCollections}
        onOpenDeleteCollections={() => setDeleteCollectionsConfirmOpen(true)}
      />
      <AllGame
        gameCards={gameCards}
        selectedGameIds={selectedGameIds}
        selectionMode={selectionMode}
        onToggleSelect={handleToggleSelect}
      />

      {selectionMode ? (
        <SelectedMenu
          selectedCount={selectedCount}
          selectedGameIds={selectedGameIds}
          allGameIds={allGameIds}
          isAddingToCollection={isAddingToCollection}
          isMarkingNsfw={isMarkingNsfw}
          isDeletingGames={isDeletingGames}
          collections={collections}
          setCreateCollectionOpen={setCreateCollectionOpen}
          setMetadataDialogOpen={setMetadataDialogOpen}
          setMergeDialogOpen={setMergeDialogOpen}
          setDeleteConfirmOpen={setDeleteConfirmOpen}
          handleAddToCollection={handleAddToCollection}
          handleBatchNsfw={handleBatchNsfw}
          handleCancelSelection={handleCancelSelection}
          handleSelectAll={handleSelectAll}
        />
      ) : null}

      <Dialog
        open={createCollectionOpen}
        onOpenChange={(open) => {
          setCreateCollectionOpen(open)
          if (!open) {
            setNewCollectionName('')
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>新建合集</DialogTitle>
          </DialogHeader>
          <Input
            value={newCollectionName}
            onChange={(event) => setNewCollectionName(event.target.value)}
            placeholder="请输入合集名称"
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateCollectionOpen(false)}>
              取消
            </Button>
            <Button type="button" onClick={() => void handleCreateCollectionAndAdd()}>
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <GameBulkUpdateMetadataDialog
        open={metadataDialogOpen}
        onOpenChange={setMetadataDialogOpen}
        gameIds={selectedGameIds}
      />

      <GameMergeDialog
        open={mergeDialogOpen}
        onOpenChange={setMergeDialogOpen}
        gameIds={selectedGameIds}
        gameNames={Object.fromEntries(gameCards.map((item) => [item.id, item.title]))}
        onMergeComplete={() => {
          void queryClient.invalidateQueries({ queryKey: ['game-cards'] })
          void queryClient.invalidateQueries({ queryKey: ['game-sidebar'] })
          void queryClient.invalidateQueries({ queryKey: ['collections'] })
          setSelectedGameIds([])
          router.refresh()
        }}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除已选游戏</AlertDialogTitle>
            <AlertDialogDescription>
              确定删除已选择的 {selectedGameIds.length} 项吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingGames}>取消</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeletingGames}
              onClick={(event) => {
                event.preventDefault()
                void handleDeleteGames()
              }}
            >
              {isDeletingGames ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteCollectionsConfirmOpen}
        onOpenChange={setDeleteCollectionsConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除已选收藏夹</AlertDialogTitle>
            <AlertDialogDescription>
              确定删除已选择的 {selectedCollectionIds.length} 个收藏夹吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingCollections}>取消</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeletingCollections}
              onClick={(event) => {
                event.preventDefault()
                void handleDeleteCollections()
              }}
            >
              {isDeletingCollections ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
