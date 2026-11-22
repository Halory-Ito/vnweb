'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAtom, useAtomValue } from 'jotai'
import {
  AlertCircle,
  CheckIcon,
  FolderPlusIcon,
  RefreshCcwIcon,
  SearchX,
  Trash2Icon,
  XIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import {
  addGameToCollection,
  createCollection,
  deleteGameById,
  getCollections,
  moveGameToCollection,
  removeGameFromCollection,
} from '@/api'
import { selectedGameIdsAtom, showNsfwAtom } from '@/atom/global'
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
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EmptyArtwork } from '@/components/ui/empty-artwork'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import GameBulkUpdateMetadataDialog from '@/features/game/components/dialog/game-bulk-update-metadata-dialog'
import GameCard from '@/features/game/components/game-card'
import GameHomeGrid from '@/features/home/components/game-home-grid'
import LibraryFolderHeader from '@/features/home/components/library-folder-header'
import LibraryGameFilter from '@/features/home/components/library-game-filter'
import LibraryGameSort from '@/features/home/components/library-game-sort'
import { useCollectionGameControls } from '@/features/home/hooks/use-collection-game-controls'

type CollectionEmptyStateProps = {
  icon: typeof AlertCircle
  title: string
  description: string
  children?: React.ReactNode
}

function CollectionEmptyState({
  icon: Icon,
  title,
  description,
  children,
}: CollectionEmptyStateProps) {
  return (
    <div className="h-[100cqh] w-full overflow-y-auto p-4">
      <div className="flex min-h-full items-center justify-center">
        <div className="bg-background/80 w-full max-w-xl rounded-2xl border px-6 py-10 text-center shadow-sm backdrop-blur-sm md:px-8">
          <div className="bg-muted text-muted-foreground mx-auto mb-4 flex size-14 items-center justify-center rounded-full border">
            <Icon className="size-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="text-muted-foreground text-sm leading-6">{description}</p>
          </div>
          {children ? (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{children}</div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function CollectionDetailSkeleton() {
  return (
    <div className="h-[100cqh] w-full overflow-y-auto p-4">
      <div className="mb-4 flex items-center gap-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-9 w-44" />
        <Skeleton className="size-9" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-8">
        <Skeleton className="aspect-3/4 w-full" />
        <Skeleton className="aspect-3/4 w-full" />
        <Skeleton className="aspect-3/4 w-full" />
        <Skeleton className="aspect-3/4 w-full" />
        <Skeleton className="aspect-3/4 w-full" />
        <Skeleton className="aspect-3/4 w-full" />
        <Skeleton className="aspect-3/4 w-full" />
        <Skeleton className="aspect-3/4 w-full" />
      </div>
    </div>
  )
}

export default function CollectionDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [selectedGameIds, setSelectedGameIds] = useAtom(selectedGameIdsAtom)
  const showNsfw = useAtomValue(showNsfwAtom)
  const [isAddingToCollection, setIsAddingToCollection] = useState(false)
  const [isDeletingGames, setIsDeletingGames] = useState(false)
  const [isDeletingSingleGame, setIsDeletingSingleGame] = useState(false)
  const [metadataDialogOpen, setMetadataDialogOpen] = useState(false)
  const [createCollectionOpen, setCreateCollectionOpen] = useState(false)
  const [deleteSelectedOpen, setDeleteSelectedOpen] = useState(false)
  const [pendingDeleteGame, setPendingDeleteGame] = useState<{
    id: number
    name: string
  } | null>(null)
  const [newCollectionName, setNewCollectionName] = useState('')

  const collectionId = Number(params.id)

  const {
    data: collections = [],
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['collections'],
    queryFn: getCollections,
  })

  const collection = collections.find((item) => item.id === collectionId)
  const otherCollections = collections.filter((item) => item.id !== collectionId)
  const {
    filters,
    sortControls,
    items: sortedGames,
    gameIds: collectionGameIds,
    hasGames,
  } = useCollectionGameControls(collection, showNsfw)
  const collectionGameIdSet = useMemo(() => new Set(collectionGameIds), [collectionGameIds])

  const selectedInCollection = useMemo(
    () => selectedGameIds.filter((id) => collectionGameIdSet.has(id)),
    [selectedGameIds, collectionGameIdSet],
  )

  const selectionMode = selectedInCollection.length > 0

  const refreshAll = async () => {
    await queryClient.invalidateQueries({ queryKey: ['collections'] })
    await queryClient.invalidateQueries({ queryKey: ['game-sidebar'] })
    await queryClient.invalidateQueries({ queryKey: ['game'] })
    await queryClient.invalidateQueries({ queryKey: ['game-cards'] })
    router.refresh()
  }

  const toggleSelect = (gameId: string) => {
    setSelectedGameIds((prev) =>
      prev.includes(gameId) ? prev.filter((item) => item !== gameId) : [...prev, gameId],
    )
  }

  const clearSelection = () => {
    setSelectedGameIds((prev) => prev.filter((id) => !collectionGameIdSet.has(id)))
  }

  const selectAllInCollection = () => {
    setSelectedGameIds((prev) => {
      const next = new Set(prev)
      collectionGameIds.forEach((id) => next.add(id))
      return [...next]
    })
  }

  const handleAddSelectedToCollection = async (targetName: string) => {
    if (selectedInCollection.length === 0) {
      return
    }

    setIsAddingToCollection(true)
    try {
      const targetCollection =
        collections.find((item) => item.name === targetName) ?? (await createCollection(targetName))

      const results = await Promise.allSettled(
        selectedInCollection.map((id) => addGameToCollection(targetCollection.id, Number(id))),
      )
      const successCount = results.filter((item) => item.status === 'fulfilled').length

      await refreshAll()
      toast.success(`已添加 ${successCount}/${selectedInCollection.length} 项`)
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: string } }
        message?: string
      }
      toast.error(err.response?.data?.error || err.message || '添加到收藏夹失败')
    } finally {
      setIsAddingToCollection(false)
    }
  }

  const handleCreateCollectionAndAdd = async () => {
    const collectionName = newCollectionName.trim()
    if (!collectionName) {
      toast.error('请输入新收藏夹名称')
      return
    }

    await handleAddSelectedToCollection(collectionName)
    setCreateCollectionOpen(false)
    setNewCollectionName('')
  }

  const handleDeleteSelected = async () => {
    if (selectedInCollection.length === 0) {
      return
    }

    setIsDeletingGames(true)
    try {
      const results = await Promise.allSettled(
        selectedInCollection.map((id) => deleteGameById(Number(id))),
      )
      const successCount = results.filter((item) => item.status === 'fulfilled').length

      clearSelection()
      setDeleteSelectedOpen(false)
      await refreshAll()
      toast.success(`已删除 ${successCount}/${selectedInCollection.length} 项`)
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: string } }
        message?: string
      }
      toast.error(err.response?.data?.error || err.message || '删除失败')
    } finally {
      setIsDeletingGames(false)
    }
  }

  const handleRemove = async (gameId: number) => {
    try {
      await removeGameFromCollection(collectionId, gameId)
      await refreshAll()
      toast.success('已移出收藏夹')
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: string } }
        message?: string
      }
      toast.error(err.response?.data?.error || err.message || '移除失败')
    }
  }

  const handleMove = async (gameId: number, targetCollectionId: number) => {
    try {
      await moveGameToCollection(collectionId, gameId, targetCollectionId)
      await refreshAll()
      toast.success('已移动到其他收藏夹')
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: string } }
        message?: string
      }
      toast.error(err.response?.data?.error || err.message || '移动失败')
    }
  }

  const handleDeleteGame = async (gameId: number) => {
    if (isDeletingSingleGame) {
      return
    }

    setIsDeletingSingleGame(true)
    try {
      await deleteGameById(gameId)
      setPendingDeleteGame(null)
      await refreshAll()
      toast.success('游戏已删除')
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: string } }
        message?: string
      }
      toast.error(err.response?.data?.error || err.message || '删除失败')
    } finally {
      setIsDeletingSingleGame(false)
    }
  }

  if (isLoading) {
    return <CollectionDetailSkeleton />
  }

  if (isError) {
    return (
      <CollectionEmptyState
        icon={AlertCircle}
        title="收藏夹信息加载失败"
        description="当前无法读取收藏夹内容，请稍后重试。"
      >
        <Button
          type="button"
          variant="outline"
          disabled={isRefetching}
          onClick={() => void refetch()}
        >
          {isRefetching ? '重试中...' : '重新加载'}
        </Button>
        <Button asChild>
          <Link href="/game/home">返回游戏主页</Link>
        </Button>
      </CollectionEmptyState>
    )
  }

  if (!collection) {
    return (
      <CollectionEmptyState
        icon={SearchX}
        title="收藏夹不存在"
        description="该收藏夹可能已被删除，或链接中的收藏夹 ID 无效。"
      >
        <Button asChild>
          <Link href="/game/home">返回游戏主页</Link>
        </Button>
      </CollectionEmptyState>
    )
  }

  return (
    <div className="@container/library h-[100cqh] w-full min-w-0 overflow-y-auto p-3 sm:p-4">
      <LibraryFolderHeader title={collection.name} className="mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <LibraryGameFilter {...filters} />
          <LibraryGameSort {...sortControls} />
        </div>
      </LibraryFolderHeader>

      {sortedGames.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-2 py-10 text-center text-sm">
          <EmptyArtwork />
          <p>{hasGames ? '没有符合条件的游戏' : '收藏夹内暂无游戏'}</p>
        </div>
      ) : (
        <GameHomeGrid>
          {sortedGames.map(({ game, title }) => (
            <ContextMenu key={game.linkId}>
              <ContextMenuTrigger asChild>
                <div>
                  <GameCard
                    id={String(game.id)}
                    title={title}
                    cover={game.cover || '/cover/wa2.jpg'}
                    href={`/game/info/${game.id}`}
                    publishAt={game.date}
                    lastRunAt={game.lastRunAt}
                    addedAt={game.addedAt}
                    playTime={game.playTime}
                    rating={game.rating}
                    status={game.status}
                    showSelection
                    selectionMode={selectionMode}
                    isSelected={selectedInCollection.includes(String(game.id))}
                    onToggleSelect={toggleSelect}
                  />
                </div>
              </ContextMenuTrigger>

              <ContextMenuContent className="w-52">
                <ContextMenuItem onClick={() => void handleRemove(game.id)}>
                  移除收藏夹
                </ContextMenuItem>
                <ContextMenuSub>
                  <ContextMenuSubTrigger>移动至其他收藏夹</ContextMenuSubTrigger>
                  <ContextMenuSubContent>
                    {otherCollections.length === 0 ? (
                      <ContextMenuItem disabled>暂无其他收藏夹</ContextMenuItem>
                    ) : (
                      otherCollections.map((item) => (
                        <ContextMenuItem
                          key={item.id}
                          onClick={() => void handleMove(game.id, item.id)}
                        >
                          {item.name}
                        </ContextMenuItem>
                      ))
                    )}
                  </ContextMenuSubContent>
                </ContextMenuSub>
                <ContextMenuItem
                  variant="destructive"
                  onClick={() => setPendingDeleteGame({ id: game.id, name: game.name })}
                >
                  删除游戏
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          ))}
        </GameHomeGrid>
      )}

      {selectionMode ? (
        <div className="bg-background/95 fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg border p-2 shadow-lg backdrop-blur">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isAddingToCollection}>
                  <FolderPlusIcon className="size-4" />
                  添加到收藏夹
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {collections.length === 0 ? (
                  <DropdownMenuItem disabled>暂无收藏夹</DropdownMenuItem>
                ) : (
                  collections.map((item) => (
                    <DropdownMenuItem
                      key={item.id}
                      onClick={() => void handleAddSelectedToCollection(item.name)}
                    >
                      {item.name}
                    </DropdownMenuItem>
                  ))
                )}
                <DropdownMenuItem
                  onClick={() => {
                    setCreateCollectionOpen(true)
                  }}
                >
                  + 新建收藏夹
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="sm" onClick={() => setMetadataDialogOpen(true)}>
              <RefreshCcwIcon className="size-4" />
              更新元数据
            </Button>

            <Button
              variant="destructive"
              size="sm"
              disabled={isDeletingGames}
              onClick={() => setDeleteSelectedOpen(true)}
            >
              <Trash2Icon className="size-4" />
              删除
            </Button>

            <Button variant="outline" size="sm" onClick={clearSelection}>
              <XIcon className="size-4" />
              取消
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={selectedInCollection.length === collectionGameIds.length}
              onClick={selectAllInCollection}
            >
              <CheckIcon className="size-4" />
              全选
            </Button>

            <div className="text-sm font-medium">已选择 {selectedInCollection.length} 项</div>
          </div>
        </div>
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
            <DialogTitle>新建收藏夹</DialogTitle>
            <DialogDescription className="sr-only">
              输入收藏夹名称，创建后可将游戏添加到收藏夹。
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newCollectionName}
            onChange={(event) => setNewCollectionName(event.target.value)}
            placeholder="请输入收藏夹名称"
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
        gameIds={selectedInCollection}
      />

      <AlertDialog open={deleteSelectedOpen} onOpenChange={setDeleteSelectedOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除已选游戏</AlertDialogTitle>
            <AlertDialogDescription>
              确定删除已选择的 {selectedInCollection.length} 项吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingGames}>取消</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeletingGames}
              onClick={(event) => {
                event.preventDefault()
                void handleDeleteSelected()
              }}
            >
              {isDeletingGames ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(pendingDeleteGame)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !isDeletingSingleGame) {
            setPendingDeleteGame(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除游戏</AlertDialogTitle>
            <AlertDialogDescription>
              确定删除游戏「{pendingDeleteGame?.name || '-'}
              」吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingSingleGame}>取消</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeletingSingleGame || !pendingDeleteGame}
              onClick={(event) => {
                event.preventDefault()
                if (!pendingDeleteGame) {
                  return
                }
                void handleDeleteGame(pendingDeleteGame.id)
              }}
            >
              {isDeletingSingleGame ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
