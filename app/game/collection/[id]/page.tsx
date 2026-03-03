'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { SortSelect } from '@/components/game/sort-select'
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
  deleteGameById,
  getCollections,
  moveGameToCollection,
  removeGameFromCollection,
} from '@/lib/game-utils'

export default function CollectionDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [order, setOrder] = useState<string>('asc')
  const [orderBy, setOrderBy] = useState<string>('add_date')

  const collectionId = Number(params.id)

  const { data: collections = [], isLoading } = useQuery({
    queryKey: ['collections'],
    queryFn: getCollections,
  })

  const collection = collections.find((item) => item.id === collectionId)
  const otherCollections = collections.filter((item) => item.id !== collectionId)

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

    return games
  }, [collection, order, orderBy])

  const refreshAll = async () => {
    await queryClient.invalidateQueries({ queryKey: ['collections'] })
    await queryClient.invalidateQueries({ queryKey: ['game'] })
    await queryClient.invalidateQueries({ queryKey: ['game-cards'] })
    router.refresh()
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

  const handleDeleteGame = async (gameId: number, gameName: string) => {
    const ok = window.confirm(`确定删除游戏「${gameName}」吗？`)
    if (!ok) {
      return
    }

    try {
      await deleteGameById(gameId)
      await refreshAll()
      toast.success('游戏已删除')
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: string } }
        message?: string
      }
      toast.error(err.response?.data?.error || err.message || '删除失败')
    }
  }

  if (isLoading) {
    return <div className="text-muted-foreground p-4 text-sm">加载中...</div>
  }

  if (!collection) {
    return <div className="text-muted-foreground p-4 text-sm">收藏夹不存在</div>
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
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {sortedGames.map((game) => (
            <ContextMenu key={game.linkId}>
              <ContextMenuTrigger asChild>
                <Link
                  href={`/game/info/${game.id}`}
                  className="flex flex-col items-center justify-center space-y-2 p-1"
                >
                  <Image
                    className="cursor-pointer rounded-lg border border-transparent object-contain transition-all duration-300 hover:scale-102 hover:border-blue-500"
                    src={game.cover || '/cover/wa2.jpg'}
                    alt={game.name}
                    width={128}
                    height={196}
                  />
                  <div className="max-w-30 truncate text-center">{game.name}</div>
                </Link>
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
                  onClick={() => void handleDeleteGame(game.id, game.name)}
                >
                  删除游戏
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          ))}
        </div>
      )}
    </div>
  )
}
