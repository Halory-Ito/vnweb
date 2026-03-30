'use client'

import { useQuery } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import {
  AlertCircle,
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  CheckIcon,
  FolderPlusIcon,
  RefreshCcwIcon,
  SearchX,
  Trash2Icon,
  XIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import GameBulkUpdateMetadataDialog from './dialog/game-bulk-update-metadata-dialog'
import GameCard from './game-card'
import { SortSelect } from './sort-select'
import { selectedGameIdsAtom } from '@/atom/global'
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
  getGameCardList,
} from '@/lib/game-utils'

type SelectableGameProps = {
  selectedGameIds: string[]
  selectionMode: boolean
  onToggleSelect: (id: string) => void
}

type GameCardsData = Awaited<ReturnType<typeof getGameCardList>>
type CollectionsData = Awaited<ReturnType<typeof getCollections>>

type RecentGameProps = SelectableGameProps & {
  gameCards: GameCardsData
}

type MyCollectionProps = {
  collections: CollectionsData
}

type AllGameProps = SelectableGameProps & {
  gameCards: GameCardsData
}

type GameHomeEmptyStateProps = {
  icon: typeof AlertCircle
  title: string
  description: string
  children?: React.ReactNode
}

function GameHomeEmptyState({
  icon: Icon,
  title,
  description,
  children,
}: GameHomeEmptyStateProps) {
  return (
    <div className="max-h-[calc(100vh-70px)] w-full overflow-x-hidden overflow-y-scroll p-4">
      <div className="flex min-h-[calc(100vh-102px)] items-center justify-center">
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

function GameHomeSkeleton() {
  return (
    <div className="max-h-[calc(100vh-70px)] w-full space-y-12 overflow-x-hidden overflow-y-scroll p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-24" />
          <div className="flex gap-2">
            <Skeleton className="size-9" />
            <Skeleton className="size-9" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
          <Skeleton className="aspect-3/4 w-full" />
          <Skeleton className="aspect-3/4 w-full" />
          <Skeleton className="aspect-3/4 w-full" />
          <Skeleton className="aspect-3/4 w-full" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-24" />
          <div className="flex gap-2">
            <Skeleton className="size-9" />
            <Skeleton className="size-9" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-8">
          <Skeleton className="aspect-3/4 w-full" />
          <Skeleton className="aspect-3/4 w-full" />
          <Skeleton className="aspect-3/4 w-full" />
          <Skeleton className="aspect-3/4 w-full" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="mb-4 flex items-center space-x-4">
          <Skeleton className="h-8 w-24" />
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
    </div>
  )
}

export default function GameHome() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [selectedGameIds, setSelectedGameIds] = useAtom(selectedGameIdsAtom)
  const [isAddingToCollection, setIsAddingToCollection] = useState(false)
  const [isDeletingGames, setIsDeletingGames] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [metadataDialogOpen, setMetadataDialogOpen] = useState(false)
  const [createCollectionOpen, setCreateCollectionOpen] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')

  const gameCardsQuery = useQuery({
    queryKey: ['game-cards'],
    queryFn: getGameCardList,
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
          disabled={
            gameCardsQuery.isRefetching || collectionsQuery.isRefetching
          }
          onClick={() => {
            void gameCardsQuery.refetch()
            void collectionsQuery.refetch()
          }}
        >
          {gameCardsQuery.isRefetching || collectionsQuery.isRefetching
            ? '重试中...'
            : '重新加载'}
        </Button>
        <Button asChild>
          <Link href="/scan">前往扫描游戏</Link>
        </Button>
      </GameHomeEmptyState>
    )
  }

  if (gameCards.length === 0) {
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
        selectedGameIds.map((id) =>
          addGameToCollection(targetCollection.id, Number(id)),
        ),
      )

      const successCount = results.filter(
        (item) => item.status === 'fulfilled',
      ).length

      await queryClient.invalidateQueries({ queryKey: ['collections'] })
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
      const successCount = results.filter(
        (item) => item.status === 'fulfilled',
      ).length

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

  return (
    <div className="max-h-[calc(100vh-70px)] w-full space-y-12 overflow-x-hidden overflow-y-scroll p-4">
      <RecentGame
        gameCards={gameCards}
        selectedGameIds={selectedGameIds}
        selectionMode={selectionMode}
        onToggleSelect={handleToggleSelect}
      />
      <MyColletion collections={collections} />
      <AllGame
        gameCards={gameCards}
        selectedGameIds={selectedGameIds}
        selectionMode={selectionMode}
        onToggleSelect={handleToggleSelect}
      />

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
                  collections.map((collection) => (
                    <DropdownMenuItem
                      key={collection.id}
                      onClick={() =>
                        void handleAddToCollection(collection.name)
                      }
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
              onClick={() => setDeleteConfirmOpen(true)}
            >
              <Trash2Icon className="size-4" />
              删除
            </Button>
            <Button variant="outline" size="sm" onClick={handleCancelSelection}>
              <XIcon className="size-4" />
              取消
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={selectedGameIds.length === allGameIds.length}
              onClick={handleSelectAll}
            >
              <CheckIcon className="size-4" />
              全选
            </Button>
            <div className="text-sm font-medium">已选择 {selectedCount} 项</div>
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
        gameIds={selectedGameIds}
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
            <AlertDialogCancel disabled={isDeletingGames}>
              取消
            </AlertDialogCancel>
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
    </div>
  )
}

const RecentGame = ({
  gameCards,
  selectedGameIds,
  selectionMode,
  onToggleSelect,
}: RecentGameProps) => {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollCards = (direction: 'left' | 'right') => {
    const offset = 320
    scrollRef.current?.scrollBy({
      left: direction === 'left' ? -offset : offset,
      behavior: 'smooth',
    })
  }

  const items: GameCardProps[] = gameCards
    .filter((item) => item.lastRunAt)
    .sort(
      (a, b) =>
        new Date(b.lastRunAt).getTime() - new Date(a.lastRunAt).getTime(),
    )
    .slice(0, 20)
  return (
    <div className="h-full w-full">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-xl font-bold">最近游戏</div>
        <div className="space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scrollCards('left')}
          >
            <ArrowLeftIcon />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scrollCards('right')}
          >
            <ArrowRightIcon />
          </Button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="no-scrollbar flex space-x-4 overflow-x-auto"
      >
        {items.map((item) => (
          <div key={item.id} className="shrink-0">
            <GameCard
              {...item}
              isSelected={selectedGameIds.includes(item.id)}
              showSelection
              selectionMode={selectionMode}
              onToggleSelect={onToggleSelect}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

const MyColletion = ({ collections }: MyCollectionProps) => {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollCards = (direction: 'left' | 'right') => {
    const offset = 320
    scrollRef.current?.scrollBy({
      left: direction === 'left' ? -offset : offset,
      behavior: 'smooth',
    })
  }

  const items: GameCardProps[] = collections
    .filter((collection) => collection.games.length > 0)
    .map((collection) => {
      const firstGame = collection.games[0]
      return {
        id: `collection-${collection.id}`,
        href: `/game/collection/${collection.id}`,
        title: collection.name,
        cover: collection.firstGameCover || firstGame.cover || '/cover/wa2.jpg',
        playTime: 0,
        publishAt: '',
        lastRunAt: '',
        addedAt: '',
        rating: 0,
      }
    })
  return (
    <div className="h-full w-full">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-xl font-bold">我的收藏</div>
        <div className="space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scrollCards('left')}
          >
            <ArrowLeftIcon />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scrollCards('right')}
          >
            <ArrowRightIcon />
          </Button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="no-scrollbar flex space-x-4 overflow-x-auto"
      >
        {items.map((item) => (
          <div key={item.id} className="shrink-0">
            <GameCard {...item} />
          </div>
        ))}
      </div>
    </div>
  )
}

const AllGame = ({
  gameCards,
  selectedGameIds,
  selectionMode,
  onToggleSelect,
}: AllGameProps) => {
  const [order, setOrder] = useState<string>('asc')
  const [orderBy, setOrderBy] = useState<string>('add_date')

  const items: GameCardProps[] = [...gameCards]

  items.sort((a, b) => {
    let compare = 0
    switch (orderBy) {
      case 'name':
        compare = a.title.localeCompare(b.title)
        break
      case 'public_date':
        compare =
          new Date(a.publishAt).getTime() - new Date(b.publishAt).getTime()
        break
      case 'last_run':
        compare =
          new Date(a.lastRunAt).getTime() - new Date(b.lastRunAt).getTime()
        break
      case 'add_date':
        compare = new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime()
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
  return (
    <div className="h-full w-full">
      <div className="mb-4 flex items-center space-x-4">
        <div className="text-xl font-bold">所有游戏</div>
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
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-8">
        {items.map((item) => (
          <GameCard
            key={item.id}
            {...item}
            isSelected={selectedGameIds.includes(item.id)}
            showSelection
            selectionMode={selectionMode}
            onToggleSelect={onToggleSelect}
          />
        ))}
      </div>
    </div>
  )
}
