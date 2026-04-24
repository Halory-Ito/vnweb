'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import { CheckIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import GameSettingsPanel from './game-settings-panel'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
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

type SidebarItemProps = GameSidebarItemProps & {
  ctrlPressed?: boolean
}

export const GameSidebarItem = ({
  title,
  icon,
  id,
  ctrlPressed = false,
}: SidebarItemProps) => {
  const pathname = usePathname()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [selectedGameIds, setSelectedGameIds] = useAtom(selectedGameIdsAtom)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLaunching, setIsLaunching] = useState(false)
  const [exePathDialogOpen, setExePathDialogOpen] = useState(false)
  const [exePathInput, setExePathInput] = useState('')
  const [collectionDialogOpen, setCollectionDialogOpen] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const { data: collections = [] } = useQuery({
    queryKey: ['collections'],
    queryFn: getCollections,
  })
  const gameId = Number(id)
  const normalizedPathname = pathname.replace(/\/+$/, '')
  const isActive =
    normalizedPathname === `/game/info/${id}` ||
    normalizedPathname.startsWith(`/game/info/${id}/`)
  const isSelected = selectedGameIds.includes(id)

  const handleItemClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!ctrlPressed && !event.ctrlKey && !event.metaKey) {
      return
    }

    event.preventDefault()
    setSelectedGameIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const navigateToInfoPage = () => {
    router.push(`/game/info/${id}`)
  }

  const handleLaunchGame = async (exePath?: string) => {
    if (isLaunching) {
      return
    }

    setIsLaunching(true)
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
        setExePathInput('')
        setExePathDialogOpen(true)
        return
      }

      toast.error(err.response?.data?.error || err.message || '启动失败')
    } finally {
      setIsLaunching(false)
    }
  }

  const confirmLaunchWithExePath = async () => {
    const nextExePath = exePathInput.trim()
    if (!nextExePath) {
      toast.error('请填写游戏可执行文件路径')
      return
    }

    setExePathDialogOpen(false)
    await handleLaunchGame(nextExePath)
  }

  const handleDeleteGame = async () => {
    if (isDeleting) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteGameById(gameId)
      setSelectedGameIds((prev) => prev.filter((item) => item !== id))
      setDeleteOpen(false)
      queryClient.removeQueries({ queryKey: ['game', String(gameId)] })
      await queryClient.invalidateQueries({
        queryKey: ['game'],
      })
      await queryClient.invalidateQueries({
        queryKey: ['game-sidebar'],
      })
      await queryClient.invalidateQueries({
        queryKey: ['game-cards'],
      })
      await queryClient.invalidateQueries({
        queryKey: ['collections'],
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
    } finally {
      setIsDeleting(false)
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
      await queryClient.invalidateQueries({ queryKey: ['game-sidebar'] })
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
    const collectionName = newCollectionName.trim()
    if (!collectionName) {
      toast.error('请输入新收藏夹名称')
      return
    }

    await handleAddToCollection(collectionName)
    setCollectionDialogOpen(false)
    setNewCollectionName('')
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Link
          className={cn(
            'flex w-full min-w-0 items-center gap-2 overflow-hidden bg-background px-1 py-0.5 transition-colors hover:bg-accent hover:text-accent-foreground dark:bg-transparent dark:hover:bg-accent/80',
            isSelected &&
              'bg-accent/70 text-accent-foreground dark:bg-accent/60 dark:text-accent-foreground',
            isActive &&
              'bg-accent text-accent-foreground dark:bg-accent/70 dark:text-accent-foreground',
          )}
          href={`/game/info/${id}`}
          onClick={handleItemClick}
        >
          <Image alt={title} src={icon} width={16} height={16} />
          <div className="min-w-0 flex-1 truncate">{title}</div>
          {ctrlPressed || isSelected ? (
            <span
              className={cn(
                'flex size-4 shrink-0 items-center justify-center rounded-full border',
                isSelected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-muted-foreground/60 bg-background/80',
              )}
            >
              {isSelected ? <CheckIcon className="size-3" /> : null}
            </span>
          ) : null}
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
              onClick={() => {
                setNewCollectionName('')
                setCollectionDialogOpen(true)
              }}
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
              onClick={() => setDeleteOpen(true)}
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

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除游戏</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除“{title}
              ”吗？此操作会同时移除该游戏的基础信息、外部映射、角色、回忆、媒体、游玩记录和收藏关联，且无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting}
              onClick={(event) => {
                event.preventDefault()
                void handleDeleteGame()
              }}
            >
              {isDeleting ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={exePathDialogOpen} onOpenChange={setExePathDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>填写游戏可执行文件路径</DialogTitle>
            <DialogDescription>
              当前游戏缺少可执行文件路径，请补充后再启动。
            </DialogDescription>
          </DialogHeader>

          <Input
            value={exePathInput}
            onChange={(event) => setExePathInput(event.target.value)}
            placeholder="例如: C:\\Games\\MyGame\\game.exe"
            disabled={isLaunching}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                void confirmLaunchWithExePath()
              }
            }}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setExePathDialogOpen(false)}
              disabled={isLaunching}
            >
              取消
            </Button>
            <Button
              type="button"
              onClick={() => void confirmLaunchWithExePath()}
              disabled={isLaunching}
            >
              {isLaunching ? '启动中...' : '确认并启动'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={collectionDialogOpen}
        onOpenChange={(nextOpen) => {
          setCollectionDialogOpen(nextOpen)
          if (!nextOpen) {
            setNewCollectionName('')
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建收藏夹</DialogTitle>
            <DialogDescription>请输入新的收藏夹名称。</DialogDescription>
          </DialogHeader>

          <Input
            value={newCollectionName}
            onChange={(event) => setNewCollectionName(event.target.value)}
            placeholder="请输入新收藏夹名称"
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                void handleCreateCollectionAndAddGame()
              }
            }}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCollectionDialogOpen(false)}
            >
              取消
            </Button>
            <Button
              type="button"
              onClick={() => void handleCreateCollectionAndAddGame()}
            >
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ContextMenu>
  )
}
