'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import {
  AlertCircle,
  ArrowDownIcon,
  ArrowUpIcon,
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

import { selectedGameIdsAtom } from '@/atom/global'
import GameBulkUpdateMetadataDialog from '@/components/game/dialog/game-bulk-update-metadata-dialog'
import GameCard from '@/components/game/game-card'
import { SortSelect } from '@/components/game/sort-select'
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
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  addGameToCollection,
  createCollection,
  deleteGameById,
  getCollections,
  moveGameToCollection,
  removeGameFromCollection,
} from '@/lib/game-utils'

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
    <div className="h-[calc(100vh-70px)] w-full overflow-y-auto p-4">
      <div className="flex min-h-full items-center justify-center">
        <div className="bg-background/80 w-full max-w-xl rounded-2xl border px-6 py-10 text-center shadow-sm backdrop-blur-sm md:px-8">
          <div className="bg-muted text-muted-foreground mx-auto mb-4 flex size-14 items-center justify-center rounded-full border">
            <Icon className="size-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="text-muted-foreground text-sm leading-6">
              {description}
            </p>
          </div>
          {children ? (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {children}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function CollectionDetailSkeleton() {
  return (
    <div className="h-[calc(100vh-70px)] w-full overflow-y-auto p-4">
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
  const [order, setOrder] = useState<string>('asc')
  const [orderBy, setOrderBy] = useState<string>('add_date')
  const [selectedGameIds, setSelectedGameIds] = useAtom(selectedGameIdsAtom)
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
  const otherCollections = collections.filter(
    (item) => item.id !== collectionId,
  )

  const collectionGameIds = useMemo(
    () => (collection ? collection.games.map((item) => String(item.id)) : []),
    [collection],
  )
  const collectionGameIdSet = useMemo(
    () => new Set(collectionGameIds),
    [collectionGameIds],
  )

  const selectedInCollection = useMemo(
    () => selectedGameIds.filter((id) => collectionGameIdSet.has(id)),
    [selectedGameIds, collectionGameIdSet],
  )

  const selectionMode = selectedInCollection.length > 0

  const sortedGames = useMemo(() => {
    if (!collection) {
      return []
    }

    const games = [...collection.games]
    games.sort((a, b) => {
      let compare = 0
      switch (orderBy) {
        case 'name':
          compare = a.name.localeCompare(b.name)
          break
        case 'public_date':
          compare = new Date(a.date).getTime() - new Date(b.date).getTime()
          break
        case 'last_run':
          compare =
            new Date(a.lastRunAt).getTime() - new Date(b.lastRunAt).getTime()
          break
        case 'add_date':
          compare =
            new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime()
          break
        case 'play_time':
          compare = a.playTime - b.playTime
          break
        case 'rating':
          compare = a.rating - b.rating
          break
      }
      return order === 'asc' ? compare : -compare
    })

    return games
  }, [collection, order, orderBy])

  const refreshAll = async () => {
    await queryClient.invalidateQueries({ queryKey: ['collections'] })
    await queryClient.invalidateQueries({ queryKey: ['game'] })
    await queryClient.invalidateQueries({ queryKey: ['game-cards'] })
    router.refresh()
  }

  const toggleSelect = (gameId: string) => {
    setSelectedGameIds((prev) =>
      prev.includes(gameId)
        ? prev.filter((item) => item !== gameId)
        : [...prev, gameId],
    )
  }

  const clearSelection = () => {
    setSelectedGameIds((prev) =>
      prev.filter((id) => !collectionGameIdSet.has(id)),
    )
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
        collections.find((item) => item.name === targetName) ??
        (await createCollection(targetName))

      const results = await Promise.allSettled(
        selectedInCollection.map((id) =>
          addGameToCollection(targetCollection.id, Number(id)),
        ),
      )
      const successCount = results.filter(
        (item) => item.status === 'fulfilled',
      ).length

      await refreshAll()
      toast.success(`已添加 ${successCount}/${selectedInCollection.length} 项`)
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: string } }
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
      const successCount = results.filter(
        (item) => item.status === 'fulfilled',
      ).length

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
    <div className="h-[calc(100vh-70px)] w-full overflow-y-auto p-4">
      <div className="mb-4 flex items-center gap-4">
        <div className="text-2xl font-bold">{collection.name}</div>
        <div className="text-xl font-bold">排序依据:</div>
        <SortSelect orderBy={orderBy} setOrderBy={setOrderBy} />
        <Button
          variant="outline"
          size="icon"
          onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')}
        >
          {order === 'asc' ? <ArrowDownIcon /> : <ArrowUpIcon />}
        </Button>
      </div>

      {sortedGames.length === 0 ? (
        <div className="text-muted-foreground rounded-md border p-4 text-sm">
          收藏夹暂无游戏
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-8">
          {sortedGames.map((game) => (
            <ContextMenu key={game.linkId}>
              <ContextMenuTrigger asChild>
                <div>
                  <GameCard
                    id={String(game.id)}
                    title={game.name}
                    cover={game.cover || '/cover/wa2.jpg'}
                    href={`/game/info/${game.id}`}
                    publishAt={game.date}
                    lastRunAt={game.lastRunAt}
                    addedAt={game.addedAt}
                    playTime={game.playTime}
                    rating={game.rating}
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
                  <ContextMenuSubTrigger>
                    移动至其他收藏夹
                  </ContextMenuSubTrigger>
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
                  onClick={() =>
                    setPendingDeleteGame({ id: game.id, name: game.name })
                  }
                >
                  删除游戏
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          ))}
        </div>
      )}

      {selectionMode ? (
        <div className="bg-background/95 fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg border p-2 shadow-lg backdrop-blur">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isAddingToCollection}
                >
                  <FolderPlusIcon className="size-4" />
                  添加到合集
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {collections.length === 0 ? (
                  <DropdownMenuItem disabled>暂无合集</DropdownMenuItem>
                ) : (
                  collections.map((item) => (
                    <DropdownMenuItem
                      key={item.id}
                      onClick={() =>
                        void handleAddSelectedToCollection(item.name)
                      }
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
                  + 新建合集
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setMetadataDialogOpen(true)}
            >
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
              disabled={
                selectedInCollection.length === collectionGameIds.length
              }
              onClick={selectAllInCollection}
            >
              <CheckIcon className="size-4" />
              全选
            </Button>

            <div className="text-sm font-medium">
              已选择 {selectedInCollection.length} 项
            </div>
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
            <DialogTitle>新建合集</DialogTitle>
          </DialogHeader>
          <Input
            value={newCollectionName}
            onChange={(event) => setNewCollectionName(event.target.value)}
            placeholder="请输入合集名称"
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateCollectionOpen(false)}
            >
              取消
            </Button>
            <Button
              type="button"
              onClick={() => void handleCreateCollectionAndAdd()}
            >
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

      <AlertDialog
        open={deleteSelectedOpen}
        onOpenChange={setDeleteSelectedOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除已选游戏</AlertDialogTitle>
            <AlertDialogDescription>
              确定删除已选择的 {selectedInCollection.length}{' '}
              项吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingGames}>
              取消
            </AlertDialogCancel>
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
            <AlertDialogCancel disabled={isDeletingSingleGame}>
              取消
            </AlertDialogCancel>
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
