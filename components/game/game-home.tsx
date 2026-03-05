'use client'

import { useQuery } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  CheckIcon,
  FolderPlusIcon,
  RefreshCcwIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import GameBulkUpdateMetadataDialog from './game-bulk-update-metadata-dialog'
import GameCard from './game-card'
import { SortSelect } from './sort-select'
import { selectedGameIdsAtom } from '@/atom/global'
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

export default function GameHome() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [selectedGameIds, setSelectedGameIds] = useAtom(selectedGameIdsAtom)
  const [isAddingToCollection, setIsAddingToCollection] = useState(false)
  const [isDeletingGames, setIsDeletingGames] = useState(false)
  const [metadataDialogOpen, setMetadataDialogOpen] = useState(false)
  const [createCollectionOpen, setCreateCollectionOpen] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')

  const { data: gameCards = [] } = useQuery({
    queryKey: ['game-cards'],
    queryFn: getGameCardList,
  })

  const { data: collections = [] } = useQuery({
    queryKey: ['collections'],
    queryFn: getCollections,
  })

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

    const ok = window.confirm(
      `确定删除已选择的 ${selectedGameIds.length} 项吗？`,
    )
    if (!ok) {
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
        selectedGameIds={selectedGameIds}
        selectionMode={selectionMode}
        onToggleSelect={handleToggleSelect}
      />
      <MyColletion />
      <AllGame
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
              onClick={() => void handleDeleteGames()}
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
    </div>
  )
}

const RecentGame = ({
  selectedGameIds,
  selectionMode,
  onToggleSelect,
}: SelectableGameProps) => {
  const scrollRef = useRef<HTMLDivElement>(null)

  const { data: gameCards = [] } = useQuery({
    queryKey: ['game-cards'],
    queryFn: getGameCardList,
  })

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

const MyColletion = () => {
  const scrollRef = useRef<HTMLDivElement>(null)

  const { data: collections = [] } = useQuery({
    queryKey: ['collections'],
    queryFn: getCollections,
  })

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
  selectedGameIds,
  selectionMode,
  onToggleSelect,
}: SelectableGameProps) => {
  const [order, setOrder] = useState<string>('asc')
  const [orderBy, setOrderBy] = useState<string>('add_date')
  const { data: gameCards = [] } = useQuery({
    queryKey: ['game-cards'],
    queryFn: getGameCardList,
  })

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
