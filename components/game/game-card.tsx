'use client'

import { useQueryClient } from '@tanstack/react-query'
import { CalendarDaysIcon, CheckIcon, Clock3Icon, PlayIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { launchGameById } from '@/lib/game/game-utils'

export default function GameCard(props: GameCardProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isLaunching, setIsLaunching] = useState(false)
  const [exePathDialogOpen, setExePathDialogOpen] = useState(false)
  const [exePathInput, setExePathInput] = useState('')
  const showSelection = Boolean(props.showSelection)
  const isSelected = Boolean(props.isSelected)
  const selectionMode = Boolean(props.selectionMode)
  const modifierSelectEnabled = Boolean(props.modifierSelectEnabled)
  const showPlayInfo = props.showPlayInfo !== false

  const gameHref = props.href || `/game/info/${props.id}`

  const formatPlayTime = (seconds: number) => {
    const safeSeconds = Math.max(0, Number(seconds) || 0)
    const hours = safeSeconds / 3600
    return `${hours.toFixed(1)}h`
  }

  const formatLastRunDate = (value: string) => {
    if (!value) {
      return '-'
    }
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return '-'
    }

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const launchAndOpen = async (exePath?: string) => {
    if (selectionMode) {
      return
    }

    const gameId = Number(props.id)
    if (!Number.isInteger(gameId) || gameId <= 0) {
      router.push(gameHref)
      return
    }

    setIsLaunching(true)
    try {
      await launchGameById(gameId, exePath)
      await queryClient.invalidateQueries({
        queryKey: ['game', String(gameId)],
      })
      router.push(gameHref)
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
        setExePathDialogOpen(true)
        return
      }

      toast.error(err.response?.data?.error || err.message || '启动失败')
    } finally {
      setIsLaunching(false)
    }
  }

  const handleLaunchAndOpen = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    await launchAndOpen()
  }

  const handleConfirmExePath = async () => {
    const nextExePath = exePathInput.trim()
    if (!nextExePath) {
      toast.error('请填写游戏可执行文件路径')
      return
    }

    setExePathDialogOpen(false)
    await launchAndOpen(nextExePath)
  }

  const handleCardClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (modifierSelectEnabled && props.onToggleSelect && (event.ctrlKey || event.metaKey)) {
      event.preventDefault()
      props.onToggleSelect(props.id)
      return
    }

    if (!showSelection || !selectionMode || !props.onToggleSelect) {
      return
    }
    event.preventDefault()
    props.onToggleSelect(props.id)
  }

  const handleToggleSelect = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    props.onToggleSelect?.(props.id)
  }

  return (
    <>
      <Link
        href={gameHref}
        className="group relative flex w-full flex-col items-center p-1 transition-all duration-300 hover:-translate-y-1"
        onClick={handleCardClick}
      >
        {showSelection ? (
          <button
            type="button"
            className={`bg-background/60 absolute top-4 left-4 z-20 flex size-7 items-center justify-center rounded-full border-2 transition-all ${
              isSelected
                ? 'border-primary bg-primary text-primary-foreground scale-100 opacity-100'
                : 'scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100'
            }`}
            onClick={handleToggleSelect}
            aria-label={isSelected ? '取消选择' : '选择'}
          >
            {isSelected ? <CheckIcon className="size-4" /> : null}
          </button>
        ) : null}

        {/* 封面图片 */}
        <div className="relative w-full">
          {/* 主图片 */}
          <div className="relative aspect-3/4 w-full overflow-hidden rounded-lg shadow-lg transition-all duration-300 group-hover:shadow-2xl">
            {/* 背景光晕效果 */}
            <div className="bg-primary/20 pointer-events-none absolute -inset-4 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-60" />

            <Image
              className="h-full w-full cursor-pointer object-cover transition-transform duration-500 group-hover:scale-110"
              src={props.cover}
              alt={props.title}
              fill
              sizes="176px"
              fetchPriority="high"
            />

            {/* 悬停遮罩 */}
            {!selectionMode && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-linear-to-t from-black/90 via-black/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                {/* 播放按钮 - 收藏卡片不显示 */}
                {!props.href && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mb-5 size-14 rounded-full bg-white/20 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-white/60 hover:shadow-xl dark:bg-black/20 dark:hover:bg-black/60"
                    onClick={(event) => void handleLaunchAndOpen(event)}
                    disabled={isLaunching}
                  >
                    <PlayIcon size={24} />
                  </Button>
                )}

                {/* 游戏信息 */}
                {showPlayInfo && (
                  <div className="absolute right-3 bottom-3 left-3 space-y-1.5">
                    {/* 游戏时长 */}
                    <div className="flex items-center gap-1.5 rounded-md px-2 py-1">
                      <Clock3Icon className="size-3 text-white/80" />
                      <span className="text-xs font-medium text-white">
                        {formatPlayTime(props.playTime)}
                      </span>
                    </div>
                    {/* 上次游玩 */}
                    <div className="flex items-center gap-1.5 rounded-md px-2 py-1">
                      <CalendarDaysIcon className="size-3 text-white/80" />
                      <span className="text-xs text-white/90">
                        {formatLastRunDate(props.lastRunAt)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 边框光效 */}
            {/* <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-white/10 transition-all duration-300 group-hover:ring-2 group-hover:ring-white/20" /> */}
          </div>
        </div>

        {/* 标题 */}
        <div className="mt-2.5 w-full px-1">
          <h3
            className="group-hover:text-primary truncate text-center text-sm leading-5 font-medium tracking-wide transition-colors"
            title={props.title}
          >
            {props.title}
          </h3>
        </div>
      </Link>

      <Dialog open={exePathDialogOpen} onOpenChange={setExePathDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>填写游戏可执行文件路径</DialogTitle>
            <DialogDescription>当前游戏缺少可执行文件路径，请补充后再启动。</DialogDescription>
          </DialogHeader>

          <Input
            value={exePathInput}
            onChange={(event) => setExePathInput(event.target.value)}
            placeholder="例如: C:\\Games\\MyGame\\game.exe"
            disabled={isLaunching}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                void handleConfirmExePath()
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
              onClick={() => void handleConfirmExePath()}
              disabled={isLaunching}
            >
              {isLaunching ? '启动中...' : '确认并启动'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
