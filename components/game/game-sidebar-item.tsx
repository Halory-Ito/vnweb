'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import GameSettingsPanel from './game-settings-panel'
import {
  ContextMenuGroup,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  addGameToCollection,
  browseLocalFileByGameId,
  createCollection,
  deleteGameById,
  getCollections,
  launchGameById,
} from '@/lib/game-utils'
import { cn } from '@/lib/utils'
import { GameSidebarItemProps } from '@/types/game-types'

export const GameSidebarItem = ({ title, icon, id }: GameSidebarItemProps) => {
  const pathname = usePathname()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { data: collections = [] } = useQuery({
    queryKey: ['collections'],
    queryFn: getCollections,
  })
  const gameId = Number(id)
  const isActive = pathname === `/game/info/${id}`

  const navigateToInfoPage = () => {
    router.push(`/game/info/${id}`)
  }

  const handleLaunchGame = async (exePath?: string) => {
    try {
      await launchGameById(gameId, exePath)
      await queryClient.invalidateQueries({
        queryKey: ['game', String(gameId)],
      })
      navigateToInfoPage()
      router.refresh()
      toast.success('游戏已启动')
    } catch (error) {
      const err = error as {
        response?: {
          data?: {
            error?: string
            requireExePath?: boolean
          }
        }
        message?: string
      }

      const requireExePath = err.response?.data?.requireExePath
      if (requireExePath) {
        const input = window.prompt('请填写游戏可执行文件路径', '')
        const nextExePath = input?.trim()
        if (nextExePath) {
          await handleLaunchGame(nextExePath)
          return
        }
      }

      toast.error(err.response?.data?.error || err.message || '启动失败')
    }
  }

  const handleDeleteGame = async () => {
    const ok = window.confirm(`确定删除游戏「${title}」吗？`)
    if (!ok) {
      return
    }

    try {
      await deleteGameById(gameId)
      queryClient.removeQueries({ queryKey: ['game', String(gameId)] })
      await queryClient.invalidateQueries({
        queryKey: ['game'],
      })

      if (pathname.startsWith(`/game/info/${id}`)) {
        router.push('/game/home')
      }

      router.refresh()
      toast.success('游戏已删除')
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
    }
  }

  const handleBrowseLocalFile = async () => {
    try {
      await browseLocalFileByGameId(gameId)
    } catch (error) {
      const err = error as {
        response?: {
          data?: {
            error?: string
            requireExePath?: boolean
          }
        }
        message?: string
      }

      const requireExePath = err.response?.data?.requireExePath
      if (requireExePath) {
        toast.error('请先添加游戏的可执行路径')
        setSettingsOpen(true)
        return
      }

      toast.error(
        err.response?.data?.error || err.message || '打开本地文件失败',
      )
    }
  }

  const handleAddToCollection = async (collectionName: string) => {
    try {
      const collection = await createCollection(collectionName)
      await addGameToCollection(collection.id, gameId)
      await queryClient.invalidateQueries({ queryKey: ['collections'] })
      router.refresh()
      toast.success(`已添加到「${collection.name}」`)
    } catch (error) {
      const err = error as {
        response?: {
          data?: {
            error?: string
          }
        }
        message?: string
      }
      toast.error(err.response?.data?.error || err.message || '添加收藏夹失败')
    }
  }

  const handleCreateCollectionAndAddGame = async () => {
    const input = window.prompt('请输入新收藏夹名称', '')
    const collectionName = input?.trim()
    if (!collectionName) {
      return
    }

    await handleAddToCollection(collectionName)
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Link
          className={cn(
            'flex items-center space-x-2 bg-background px-1 py-0.5 transition-colors hover:bg-accent hover:text-accent-foreground dark:bg-transparent dark:hover:bg-accent/80',
            isActive &&
              'bg-accent text-accent-foreground dark:bg-transparent dark:text-accent-foreground',
          )}
          href={`/game/info/${id}`}
        >
          <Image alt={title} src={icon} width={16} height={16} />
          <div className="truncate">{title}</div>
        </Link>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        <ContextMenuItem onClick={() => void handleLaunchGame()}>
          开始游戏
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger>添加至</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            {collections.length === 0 ? (
              <ContextMenuItem disabled>暂无收藏夹</ContextMenuItem>
            ) : (
              collections.map((collection) => (
                <ContextMenuItem
                  key={collection.id}
                  onClick={() => void handleAddToCollection(collection.name)}
                >
                  {collection.name}
                </ContextMenuItem>
              ))
            )}
            <ContextMenuItem
              onClick={() => void handleCreateCollectionAndAddGame()}
            >
              +新收藏
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSub>
          <ContextMenuSubTrigger>管理</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem onClick={() => void handleBrowseLocalFile()}>
              浏览本地文件
            </ContextMenuItem>
            <ContextMenuItem
              variant="destructive"
              onClick={() => void handleDeleteGame()}
            >
              删除
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuGroup>
          <ContextMenuItem onClick={() => setSettingsOpen(true)}>
            属性
          </ContextMenuItem>
        </ContextMenuGroup>
      </ContextMenuContent>

      <GameSettingsPanel
        gameId={gameId}
        gameTitle={title}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </ContextMenu>
  )
}
